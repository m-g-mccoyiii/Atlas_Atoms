"""The Overreact engine on real molecules (RDKit).

  Engine        fires reactions, lets the molecule react with itself, plays a turn and a round.
  players       random_player, greedy_player, lookahead_player.
  measures      summarize, best_line_stats, compare_carried, run_rounds, game_comparison, timing.

A molecule is a canonical SMILES string everywhere.  Reactions and self-reactions come from library.py.

The rules of the round (docs/CASCADES.md, docs/HARNESS.md section A to T):
  * a round is one molecule and three turns; a turn deals five of the carried reactions (at most eight), three are lined up
    in order and fired; each reaction makes its change everywhere it fits;
  * after each reaction that acted, the molecule's self-reactions run one at a time until none fits; each is one step of
    the turn's chain (the cap is 40 steps a turn; `capped` says it was hit).  Which goes first: the lowest rule.prio, then
    the nearest pair, then the order of the rules.  A rule with rule.per_turn stops after that many steps in the turn
    (dry 1, weld 2, ring 2);
  * a reaction that finds nothing, or that would grow the molecule past 56 heavy atoms, is wasted: it spends its use and
    sets nothing off;
  * a reaction can be used three times a round;
  * when the turn ends the rings a self-reaction closed loosely open again;
  * step n of a turn's chain pays 50 * (1 + (n - 1) * w) where w = 1 if n is past the longest chain of any earlier turn of the
    round and 0.25 if not (path.js CASC, RULE.fresh), and adds 0.1 * n * w to extra.
"""
import itertools
import math
import random
import time
from collections import Counter, defaultdict

from rdkit import Chem

import chemlib
from chemlib import parse, comp, canon
import library
from library import REACTIONS, SELF_RULES, SELF_ORDER, SELF_RING, SELF_TIER1, SELF_ALL, SIX, POOL19, reopen

MAX_HEAVY = 56
STEP_CAP = 40
PLACE = 50.0
OLD = 0.25
EXTRA_STEP = 0.1
USES = 3
HAND = 5
TURNS = 3
# path.js RUNG.from: dehydrate joins the deal in round 4 and grow in round 5
GATING = {'dehydrate': 4, 'grow': 5}


def pay_of(n, best_prior, place=PLACE, old=OLD):
    """(pay, extra, full-pay steps) of a chain of n steps when the longest earlier chain of the round was best_prior."""
    pay = 0.0
    extra = 0.0
    full = 0
    for k in range(1, n + 1):
        fresh = k > best_prior
        w = 1.0 if fresh else old
        pay += place * (1.0 + (k - 1) * w)
        extra += EXTRA_STEP * k * w
        full += 1 if fresh else 0
    return pay, extra, full


_PAY = {}


def pay_cached(n, best_prior):
    k = (n, best_prior)
    v = _PAY.get(k)
    if v is None:
        v = _PAY[k] = pay_of(n, best_prior)
    return v


class Fired:
    __slots__ = ('smi', 'n', 'off', 'acted', 'blocked')

    def __init__(self, smi, n, off, acted, blocked=False):
        self.smi = smi
        self.n = n
        self.off = off
        self.acted = acted
        self.blocked = blocked


class Turn:
    """What a line of reactions did to a molecule in one turn, before the rings open again."""
    __slots__ = ('smi', 'steps', 'fired', 'off', 'capped', 'set_off')

    def __init__(self, smi, steps, fired, off, capped, set_off):
        self.smi = smi
        self.steps = steps          # names of the self-reactions, in order: the chain
        self.fired = fired          # ((reaction, places it acted at), ...)
        self.off = off              # ((jar, count), ...)
        self.capped = capped
        self.set_off = set_off      # steps set off by each reaction of the line


class Engine:
    def __init__(self, reactions=None, self_rules=None, max_heavy=MAX_HEAVY, cap=STEP_CAP, check_balance=False):
        self.reactions = dict(reactions or REACTIONS)
        self.self_rules = dict(self_rules or SELF_RULES)
        self.max_heavy = max_heavy
        self.cap = cap
        self.check_balance = check_balance
        self._fire = {}
        self._settle = {}
        self._line = {}
        self._reopen = {}
        self._val = {}

    # --- reactions -----------------------------------------------------------------------------------------
    def fire(self, smi, name):
        """One reaction at every place it fits.  Wasted (acted False) when it fits nowhere or the result is past the size limit."""
        key = (smi, name)
        hit = self._fire.get(key)
        if hit is not None:
            return hit
        mol = parse(smi)
        r = self.reactions[name].fire(mol)
        out = Chem.MolToSmiles(r.mol)
        if self.check_balance and r.n:
            before = comp(mol) + r.added
            after = comp(r.mol) + r.lost
            if +before - +after or +after - +before:
                raise AssertionError('atoms do not balance in %s on %s: %s vs %s' % (name, smi, dict(before), dict(after)))
        if r.n == 0:
            res = Fired(smi, 0, (), False)
        elif parse(out).GetNumHeavyAtoms() > self.max_heavy and parse(out).GetNumHeavyAtoms() > mol.GetNumHeavyAtoms():
            res = Fired(smi, 0, (), False, blocked=True)
        else:
            res = Fired(out, r.n, tuple(sorted(r.off.items())), True)
        self._fire[key] = res
        return res

    # --- what the molecule does by itself ------------------------------------------------------------------
    def _next_self(self, mol, rules):
        cands = []
        for ri, rn in enumerate(rules):
            rule = self.self_rules[rn]
            sites = rule.find(mol)
            if sites:
                cands.append(((getattr(rule, 'prio', 1), sites[0].dist, ri), rule, sites))
        cands.sort(key=lambda t: t[0])
        for _, rule, sites in cands:
            for s in sites:
                r = rule.apply(mol, s)
                if r is not None:
                    return rule, r
        return None

    def settle(self, smi, rules, budget, used=()):
        """The molecule reacts with itself, one place at a time, the nearest first, until nothing fits or `budget` steps are
        done.  A self-reaction that has a limit per turn (rule.per_turn) stops after that many steps in the turn: `used` holds
        the steps already made earlier in the turn.  Returns (smiles, steps, off items, capped)."""
        key = (smi, rules, budget, used)
        hit = self._settle.get(key)
        if hit is not None:
            return hit
        mol = parse(smi)
        steps = []
        off = Counter()
        capped = False
        cnt = Counter(dict(used))
        while True:
            act = tuple(r for r in rules if getattr(self.self_rules[r], 'per_turn', None) is None
                        or cnt[r] < self.self_rules[r].per_turn)
            if len(steps) >= budget:
                capped = self._next_self(mol, act) is not None
                break
            nxt = self._next_self(mol, act)
            if nxt is None:
                break
            rule, (mol, dropped) = nxt
            steps.append(rule.name)
            cnt[rule.name] += 1
            for k, v in rule.off.items():
                off[k] += v
        res = (Chem.MolToSmiles(mol), tuple(steps), tuple(sorted(off.items())), capped)
        self._settle[key] = res
        return res

    def reopen(self, smi):
        r = self._reopen.get(smi)
        if r is None:
            mol, n = reopen(parse(smi))
            r = self._reopen[smi] = (Chem.MolToSmiles(mol), n)
        return r

    # --- a line of reactions -------------------------------------------------------------------------------
    def run_line(self, smi, line, rules):
        """Fire `line` (a tuple of reaction names) in order on smi; after each that acted, the self-reactions run."""
        key = (smi, line, rules)
        hit = self._line.get(key)
        if hit is not None:
            return hit
        if not line:
            res = Turn(smi, (), (), (), False, ())
        else:
            prev = self.run_line(smi, line[:-1], rules)
            f = self.fire(prev.smi, line[-1])
            if not f.acted:
                res = Turn(prev.smi, prev.steps, prev.fired + ((line[-1], 0),), prev.off, prev.capped,
                           prev.set_off + (0,))
            else:
                s2, st, off2, capped = self.settle(f.smi, rules, self.cap - len(prev.steps), tuple(sorted(Counter(prev.steps).items())))
                off = Counter(dict(prev.off))
                off.update(dict(f.off))
                off.update(dict(off2))
                res = Turn(s2, prev.steps + st, prev.fired + ((line[-1], f.n),), tuple(sorted(off.items())),
                           prev.capped or capped, prev.set_off + (len(st),))
        self._line[key] = res
        return res

    def trace_line(self, smi, line, rules):
        """Like run_line, but returns every state: [(label, smiles)], the start first, then the molecule right after each
        reaction of the line that acted (label = its name) and after each self-reaction step (label = its name)."""
        states = [('start', smi)]
        cnt = Counter()
        cur = smi
        for r in line:
            f = self.fire(cur, r)
            if not f.acted:
                continue
            cur = f.smi
            states.append((r, cur))
            mol = parse(cur)
            for _ in range(self.cap):
                act = tuple(x for x in rules if getattr(self.self_rules[x], 'per_turn', None) is None
                            or cnt[x] < self.self_rules[x].per_turn)
                nxt = self._next_self(mol, act)
                if nxt is None:
                    break
                rule, (mol, dropped) = nxt
                cnt[rule.name] += 1
                states.append((rule.name, Chem.MolToSmiles(mol)))
            cur = Chem.MolToSmiles(mol)
        return states

    def clear(self):
        self._fire.clear()
        self._settle.clear()
        self._line.clear()
        self._reopen.clear()
        self._val.clear()

    # --- a round -------------------------------------------------------------------------------------------
    def hand_for(self, carried, left, seed, turn, hand_size=HAND):
        """The reactions dealt for a turn: a seeded random pick of hand_size of those carried that have a use left.
        The same (seed, turn, uses left) always gives the same hand, so a player can look at the next turn's hand."""
        bag = [r for r in carried if left.get(r, 0) > 0]
        if len(bag) <= hand_size:
            return tuple(bag)
        rng = random.Random('%s/%d' % (seed, turn))
        return tuple(rng.sample(bag, hand_size))

    def valid_lines(self, hand, left, length=3):
        out = []
        for L in range(length, 0, -1):
            for line in itertools.product(hand, repeat=L):
                c = Counter(line)
                if all(left.get(r, 0) >= n for r, n in c.items()):
                    out.append(line)
            if out:
                return out
        return out

    def evaluate(self, smi, hand, left, rules, best_prior):
        """[(line, Turn, pay)] for every line that can be played."""
        out = []
        for line in self.valid_lines(hand, left):
            t = self.run_line(smi, line, rules)
            out.append((line, t, pay_cached(len(t.steps), best_prior)[0]))
        return out

    def best_value(self, smi, carried, left, rules, best_prior, seed, turn, turns, depth):
        """Best total pay from this turn on, for at most `depth` turns, played greedily on pay (used by look-ahead)."""
        if turn >= turns or depth <= 0:
            return 0.0
        hand = self.hand_for(carried, left, seed, turn)
        key = (smi, hand, tuple(sorted(left.items())), best_prior, turn, turns, depth, rules)
        v = self._val.get(key)
        if v is not None:
            return v
        best = 0.0
        for line, t, p in self.evaluate(smi, hand, left, rules, best_prior):
            val = p
            if depth > 1 and turn + 1 < turns:
                nsmi, _ = self.reopen(t.smi)
                nleft = dict(left)
                for r in line:
                    nleft[r] -= 1
                val += self.best_value(nsmi, carried, nleft, rules, max(best_prior, len(t.steps)), seed, turn + 1, turns,
                                       depth - 1)
            if val > best:
                best = val
        self._val[key] = best
        return best

    def play_round(self, smi, carried, rules, player, seed, turns=TURNS, uses=USES, hand_size=HAND, analyse=True):
        """Play one round on molecule smi.  carried: tuple of reaction names (at most eight).  rules: tuple of self-reaction
        names in their order.  player: an object with choose(ctx).  Returns a dict (see RoundResult in the README)."""
        carried = tuple(carried)
        rules = tuple(rules)
        smi = canon(smi)
        smi, _ = self.reopen(smi)
        left = {r: uses for r in carried}
        best_prior = 0
        rr = {'smi0': smi, 'carried': carried, 'rules': rules, 'seed': seed, 'turns': [], 'pay': 0.0, 'extra': 1.0,
              'off': Counter(), 'capped': False}
        prng = random.Random('player/%s' % seed)
        for t in range(turns):
            hand = self.hand_for(carried, left, seed, t, hand_size)
            ctx = Ctx(self, smi, carried, hand, dict(left), rules, best_prior, seed, t, turns, prng)
            line = player.choose(ctx) if hand else ()
            sim = self.run_line(smi, tuple(line), rules)
            n = len(sim.steps)
            p, e, full = pay_cached(n, best_prior)
            td = {'hand': hand, 'line': tuple(line), 'chain': sim.steps, 'n': n, 'pay': p, 'extra': e, 'full': full,
                  'fired': sim.fired, 'off': dict(sim.off), 'capped': sim.capped, 'smi_in': smi, 'smi_end': sim.smi,
                  'set_off': sim.set_off, 'best_prior': best_prior}
            if analyse and hand:
                lines = ctx.evaluate()
                bp = max(x[2] for x in lines) if lines else 0.0
                best_lines = [x[0] for x in lines if x[2] == bp]
                td['best_pay'] = bp
                td['n_best_lines'] = len(best_lines)
                td['best_steps'] = max(len(x[1].steps) for x in lines) if lines else 0
                td['in_best'] = sorted({r for l in best_lines for r in l})
                td['in_every_best'] = sorted({r for r in hand if all(r in l for l in best_lines)})
                need = []
                for r in hand:
                    wo = [x[2] for x in lines if r not in x[0]]
                    if not wo or max(wo) < bp:
                        need.append(r)
                td['needed'] = need
            for r in line:
                left[r] -= 1
            smi, nopened = self.reopen(sim.smi)
            td['smi_out'] = smi
            td['opened'] = nopened
            best_prior = max(best_prior, n)
            rr['pay'] += p
            rr['extra'] += e
            rr['off'].update(dict(sim.off))
            rr['capped'] = rr['capped'] or sim.capped
            rr['turns'].append(td)
        rr['steps'] = [t['n'] for t in rr['turns']]
        rr['longest'] = max(rr['steps']) if rr['steps'] else 0
        return rr


class Ctx:
    """What a player is shown when it chooses a line."""

    def __init__(self, engine, smi, carried, hand, left, rules, best_prior, seed, turn, turns, rng):
        self.engine = engine
        self.smi = smi
        self.carried = carried
        self.hand = hand
        self.left = left
        self.rules = rules
        self.best_prior = best_prior
        self.seed = seed
        self.turn = turn
        self.turns = turns
        self.rng = rng
        self._eval = None

    def evaluate(self):
        if self._eval is None:
            self._eval = self.engine.evaluate(self.smi, self.hand, self.left, self.rules, self.best_prior)
        return self._eval


# ---------------------------------------------------------------------------------------------------------------
# players
# ---------------------------------------------------------------------------------------------------------------


class RandomPlayer:
    """Lines up three reactions of the hand at random (a new player who does not read the molecule)."""
    name = 'random'

    def choose(self, ctx):
        left = dict(ctx.left)
        line = []
        for _ in range(3):
            opts = [r for r in ctx.hand if left.get(r, 0) > 0]
            if not opts:
                break
            r = ctx.rng.choice(opts)
            left[r] -= 1
            line.append(r)
        return tuple(line)


class GreedyPlayer:
    """The best line of three for this turn (most pay; objective 'steps' ranks by steps first).  Ties are drawn at random."""
    name = 'greedy'

    def __init__(self, objective='pay'):
        self.objective = objective

    def choose(self, ctx):
        lines = ctx.evaluate()
        if not lines:
            return ()
        if self.objective == 'steps':
            key = lambda x: (len(x[1].steps), x[2])
        else:
            key = lambda x: x[2]
        top = max(key(x) for x in lines)
        best = [x[0] for x in lines if key(x) == top]
        return ctx.rng.choice(best)


class LookaheadPlayer:
    """Searches this turn and the next (depth 2): the line whose pay plus the best next turn's pay (the next hand is known)
    is the largest."""
    name = 'lookahead'

    def __init__(self, depth=2):
        self.depth = depth

    def choose(self, ctx):
        lines = ctx.evaluate()
        if not lines:
            return ()
        eng = ctx.engine
        scored = []
        for line, t, p in lines:
            val = p
            if self.depth > 1 and ctx.turn + 1 < ctx.turns:
                nsmi, _ = eng.reopen(t.smi)
                nleft = dict(ctx.left)
                for r in line:
                    nleft[r] -= 1
                val += eng.best_value(nsmi, ctx.carried, nleft, ctx.rules, max(ctx.best_prior, len(t.steps)), ctx.seed,
                                      ctx.turn + 1, ctx.turns, self.depth - 1)
            scored.append((val, line))
        top = max(v for v, _ in scored)
        return ctx.rng.choice([l for v, l in scored if v == top])


PLAYERS = {'random': RandomPlayer(), 'greedy': GreedyPlayer(), 'greedy_steps': GreedyPlayer('steps'),
           'lookahead': LookaheadPlayer()}

ENGINE = Engine()


# ---------------------------------------------------------------------------------------------------------------
# running many rounds
# ---------------------------------------------------------------------------------------------------------------

def carried_for_round(base, rnd, gating=True):
    """The carried reactions of a round, with the game's gentle deal: dehydrate from round 4, grow from round 5."""
    if not gating:
        return tuple(base)
    return tuple(r for r in base if GATING.get(r, 0) <= rnd)


def run_rounds(engine, smiles, carried, rules, player, seeds, gating=False, rounds=None, analyse=True):
    """Play one round for every (molecule, seed).  smiles: a list of SMILES (cycled) or a callable(i, seed) -> (smi, round)."""
    out = []
    pl = PLAYERS[player] if isinstance(player, str) else player
    for i, seed in enumerate(seeds):
        if callable(smiles):
            smi, rnd = smiles(i, seed)
        else:
            smi = smiles[i % len(smiles)]
            rnd = rounds[i % len(rounds)] if rounds else 1
        car = carried_for_round(carried, rnd, gating)
        out.append(engine.play_round(smi, car, rules, pl, seed, analyse=analyse))
    return out


def deal_source(round_no=None, tier=3, extra=None):
    """A molecule source for run_rounds that deals as the game does: round_no fixed, or cycling 1..9."""
    import molecules

    def src(i, seed):
        rnd = round_no or (i % 9) + 1
        rng = random.Random('mol/%s' % seed)
        return molecules.deal_molecule(rnd, rng, tier, extra=extra), rnd
    return src


# ---------------------------------------------------------------------------------------------------------------
# measures
# ---------------------------------------------------------------------------------------------------------------

def _mean(a):
    return sum(a) / len(a) if a else 0.0


def _sd(a):
    if len(a) < 2:
        return 0.0
    m = _mean(a)
    return math.sqrt(sum((x - m) ** 2 for x in a) / (len(a) - 1))


def _share(a, k):
    return sum(1 for x in a if x >= k) / len(a) if a else 0.0


def summarize(results):
    """Numbers over a list of round results (play_round dicts)."""
    turns = [t for r in results for t in r['turns']]
    steps = [t['n'] for t in turns]
    out = {'rounds': len(results), 'turns': len(turns)}
    out['steps_mean'] = _mean(steps)
    out['steps_sd'] = _sd(steps)
    out['steps_max'] = max(steps) if steps else 0
    for k in (1, 3, 6, 10):
        out['share_%d_plus' % k] = _share(steps, k)
    out['round_longest_mean'] = _mean([r['longest'] for r in results])
    pays = [r['pay'] for r in results]
    out['pay_mean'] = _mean(pays)
    out['pay_sd'] = _sd(pays)
    out['pay_median'] = sorted(pays)[len(pays) // 2] if pays else 0
    # spread of steps within a round (turn to turn) and between rounds
    out['steps_sd_within_round'] = _mean([_sd([t['n'] for t in r['turns']]) for r in results])
    fired = Counter()
    kinds = Counter()
    for t in turns:
        c = Counter(t['chain'])
        fired.update(c)
        kinds[len(c)] += 1
    total = sum(fired.values())
    out['self_fired'] = dict(fired)
    out['self_share_of_steps'] = {k: v / total for k, v in fired.items()} if total else {}
    out['self_pages'] = {k: sum(1 for t in turns if k in t['chain']) / len(turns) for k in fired} if turns else {}
    out['kinds_per_chain'] = {k: kinds[k] / len(turns) for k in sorted(kinds)} if turns else {}
    out['kinds_mean_when_chain'] = _mean([len(set(t['chain'])) for t in turns if t['chain']])
    off = Counter()
    for r in results:
        off.update(r['off'])
    out['off_per_round'] = {k: v / len(results) for k, v in off.items()} if results else {}
    out['capped_rounds'] = sum(1 for r in results if r['capped'])
    # which reaction is in the best line, and is the best line worse without it
    seen = Counter()
    inb = Counter()
    inall = Counter()
    need = Counter()
    for t in turns:
        if 'best_pay' not in t:
            continue
        for r in t['hand']:
            seen[r] += 1
            inb[r] += 1 if r in t['in_best'] else 0
            inall[r] += 1 if r in t['in_every_best'] else 0
            need[r] += 1 if r in t['needed'] else 0
    out['best_line'] = {r: {'dealt': seen[r], 'in_a_best_line': inb[r] / seen[r], 'in_every_best_line': inall[r] / seen[r],
                            'best_line_worse_without': need[r] / seen[r]} for r in seen}
    out['turns_with_chain_after_nothing'] = sum(1 for t in turns if t['n'] == 0) / len(turns) if turns else 0
    return out


def format_summary(s):
    lines = ['%d rounds, %d turns' % (s['rounds'], s['turns']),
             'steps a turn: mean %.2f, sd %.2f, longest %d' % (s['steps_mean'], s['steps_sd'], s['steps_max']),
             'turns with at least 1/3/6/10 steps: %.0f%% / %.0f%% / %.1f%% / %.1f%%' % (
                 100 * s['share_1_plus'], 100 * s['share_3_plus'], 100 * s['share_6_plus'], 100 * s['share_10_plus']),
             'round pay: mean %.0f, median %.0f, sd %.0f' % (s['pay_mean'], s['pay_median'], s['pay_sd'])]
    if s['self_fired']:
        lines.append('self-reactions (share of steps): ' + ', '.join(
            '%s %.0f%%' % (k, 100 * v) for k, v in sorted(s['self_share_of_steps'].items(), key=lambda kv: -kv[1])))
        lines.append('different self-reactions in a chain: ' + ', '.join(
            '%d: %.0f%%' % (k, 100 * v) for k, v in s['kinds_per_chain'].items()))
    if s['off_per_round']:
        lines.append('comes off per round: ' + ', '.join('%s %.2f' % (k, v) for k, v in sorted(s['off_per_round'].items())))
    lines.append('capped rounds: %d' % s['capped_rounds'])
    if s['best_line']:
        lines.append('reaction: times dealt / in some best line / in every best line / best line worse without it')
        for r, d in sorted(s['best_line'].items(), key=lambda kv: -kv[1]['best_line_worse_without']):
            lines.append('  %-16s %5d  %4.0f%%  %4.0f%%  %4.0f%%' % (r, d['dealt'], 100 * d['in_a_best_line'],
                                                                   100 * d['in_every_best_line'],
                                                                   100 * d['best_line_worse_without']))
    return '\n'.join(lines)


def _tv(p, q):
    keys = set(p) | set(q)
    return 0.5 * sum(abs(p.get(k, 0) - q.get(k, 0)) for k in keys)


def compare_carried(engine, set_a, set_b, smiles, seeds, rules=SELF_RING, player='greedy', gating=False, rounds=None):
    """How differently two carried sets play on the same molecules and the same deals.  Returns a dict:
    pay means, steps means, total-variation distance between the distributions of steps a turn, the distance between the
    shares of each self-reaction in the chains, how often the two sets pick a different first reaction, and the share of
    rounds in which the two earn the same."""
    ra = run_rounds(engine, smiles, set_a, rules, player, seeds, gating, rounds, analyse=False)
    rb = run_rounds(engine, smiles, set_b, rules, player, seeds, gating, rounds, analyse=False)
    sa, sb = summarize(ra), summarize(rb)

    def dist(rs):
        c = Counter(t['n'] for r in rs for t in r['turns'])
        n = sum(c.values())
        return {k: v / n for k, v in c.items()}

    def uses(rs):
        c = Counter(x for r in rs for t in r['turns'] for x in t['line'])
        n = sum(c.values())
        return {k: v / n for k, v in c.items()}
    same = sum(1 for a, b in zip(ra, rb) if abs(a['pay'] - b['pay']) < 1e-9) / len(ra)
    return {'pay_a': sa['pay_mean'], 'pay_b': sb['pay_mean'], 'steps_a': sa['steps_mean'], 'steps_b': sb['steps_mean'],
            'steps_distribution_distance': _tv(dist(ra), dist(rb)),
            'self_reaction_share_distance': _tv(sa['self_share_of_steps'], sb['self_share_of_steps']),
            'reaction_use_distance': _tv(uses(ra), uses(rb)), 'same_pay_share': same,
            'pay_ratio': sb['pay_mean'] / sa['pay_mean'] if sa['pay_mean'] else float('nan')}


def best_line_stats(engine, smiles, hand, rules=SELF_RING, best_prior=0):
    """For one molecule and one hand: every line's steps, the best line(s), and for each reaction whether the best is worse
    without it."""
    left = {r: USES for r in hand}
    lines = engine.evaluate(canon(smiles) if isinstance(smiles, str) else smiles, tuple(hand), left, tuple(rules), best_prior)
    top = max(x[2] for x in lines)
    best = [x for x in lines if x[2] == top]
    return {'best_pay': top, 'best_steps': max(len(x[1].steps) for x in lines), 'n_best': len(best),
            'best_lines': [x[0] for x in best[:5]],
            'worse_without': {r: (max([x[2] for x in lines if r not in x[0]] or [0]) < top) for r in hand}}


# ---------------------------------------------------------------------------------------------------------------
# the check against the game
# ---------------------------------------------------------------------------------------------------------------

def molecule_weights(tier=3):
    """How often each of the game's molecules is dealt, rounds 1..9 weighted equally (molecules.deal_weights)."""
    import molecules
    mols = molecules.game_molecules()
    w = Counter()
    for r in range(1, 10):
        for k, v in molecules.deal_weights(r, tier, mols).items():
            w[k] += v / 9.0
    return w


def game_comparison(engine=None, seeds=20, players=('random', 'greedy_steps', 'lookahead'), gating=False, tier=3,
                    rules=SELF_RING, carried=SIX):
    """The six starting reactions and ring on the game's molecules, each molecule weighted as the rounds deal it, three
    turns, hand of five from the six, three uses each.  Returns per player the share of turns with 1/3/6/10+ steps and the mean."""
    engine = engine or ENGINE
    w = molecule_weights(tier)
    res = {}
    for pn in players:
        acc = defaultdict(float)
        total = 0.0
        for smi, wt in sorted(w.items()):
            rs = run_rounds(engine, [smi], carried, rules, pn, range(seeds), gating=False, analyse=False)
            ss = [t['n'] for r in rs for t in r['turns']]
            acc['mean'] += wt * _mean(ss)
            for k in (1, 3, 6, 10):
                acc[k] += wt * _share(ss, k)
            total += wt
            engine.clear()          # the next molecule shares nothing with this one; keep memory flat
        res[pn] = {k: v / total for k, v in acc.items()}
    return res


def screen(engine, smiles, pool=SIX, rules=SELF_RING, hand=HAND):
    """The same numbers as the game's AA.rxPath.screen(smiles): steps as dealt (no reagent fired), the best line of three
    from the whole pool, the best line from each deal of `hand` reagents, and the share of all lines of three with 1 and 3
    or more steps.  Use it to diff against the game molecule by molecule."""
    smi = engine.reopen(canon(smiles))[0]
    pool = tuple(pool)
    rules = tuple(rules)
    dealt = len(engine.settle(smi, rules, STEP_CAP)[1])
    lines = {l: len(engine.run_line(smi, l, rules).steps) for l in itertools.product(pool, repeat=3)}
    best = max(lines.values())
    line = next(l for l, v in lines.items() if v == best)
    k = min(hand, len(pool))
    hands = [max(v for l, v in lines.items() if set(l) <= set(h)) for h in itertools.combinations(pool, k)]
    return {'heavy': parse(smi).GetNumHeavyAtoms(), 'dealt': dealt, 'best': best, 'line': line, 'hands': hands,
            'ge1': sum(1 for v in lines.values() if v >= 1) / len(lines),
            'ge3': sum(1 for v in lines.values() if v >= 3) / len(lines)}


def screen_table(engine=None, pool=SIX, rules=SELF_RING):
    """One row per molecule of the game's table: canonical SMILES, heavy atoms, dealt, best, mean best over the deals, ge1, ge3."""
    engine = engine or ENGINE
    rows = []
    for m in __import__('molecules').game_molecules():
        r = screen(engine, m.canonical, pool, rules)
        rows.append((m.canonical, r['heavy'], r['dealt'], r['best'], sum(r['hands']) / len(r['hands']), r['ge1'], r['ge3']))
    return rows


def timing(engine=None, n=300, player='greedy', carried=SIX, rules=SELF_RING, cold=True):
    """Seconds to play n rounds on molecules dealt as the game does (cold caches by default)."""
    engine = engine or Engine()
    if cold:
        engine.clear()
    src = deal_source()
    t0 = time.time()
    run_rounds(engine, src, carried, rules, player, range(n), gating=True, analyse=False)
    return time.time() - t0


if __name__ == '__main__':
    import sys
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'demo'
    if cmd == 'demo':
        import molecules
        src = deal_source()
        for pn in ('random', 'greedy', 'lookahead'):
            rs = run_rounds(Engine(), src, SIX, SELF_RING, pn, range(60), gating=True)
            print('==', pn)
            print(format_summary(summarize(rs)))
    elif cmd == 'game':
        r = game_comparison(Engine(), seeds=int(sys.argv[2]) if len(sys.argv) > 2 else 20)
        for pn, d in r.items():
            print(pn, {k: round(v, 3) for k, v in d.items()})
    elif cmd == 'screen':
        print('smiles,heavy,dealt,best,mean_best_over_hands,ge1,ge3')
        for row in screen_table(Engine()):
            print('%s,%d,%d,%d,%.3f,%.3f,%.3f' % row)
    elif cmd == 'time':
        for pn in ('random', 'greedy', 'lookahead'):
            print(pn, '%.1f s for 300 rounds' % timing(Engine(), 300, pn))
