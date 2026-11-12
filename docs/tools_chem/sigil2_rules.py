"""sigil2_rules.py: sigils as rule-breakers.

The owner (12 November): a sigil breaks or changes a rule, "like carbons can have 5 bonds or other fun 'alchemy' things".
Each sigil here changes ONE rule of the chemistry or of the game for the whole run.  Each is a sweep_core.Mod: it changes the
rule numbers (G.p), the reagents (G.reactions) or the reflexes (G.self_rules, G.near, G.far) once, in setup.  Rule objects of
library.py and fold.py are never changed in place: a sigil works on copies.

Where a sigil breaks valence (Quintessence) RDKit's valence check is stepped round explicitly: the extra bond is stored as a
dative bond FROM the carbon, which RDKit does not count in the carbon's valence.  The molecule stays a real graph (the ring is
there for the readers of the spec) and every SMILES still parses.

  python sigil2_rules.py            the table and a self-test of the chemistry each one changes
"""
import copy

from rdkit import Chem

import chemlib
from chemlib import GraphRule, Reaction, SmartsStep, pair_sites, parse
import library as L
import fold as F
import sweep_core as SC

KC, ONE_HET = L.KC, L.ONE_HET


class Sigil(SC.Mod):
    id = ''
    title = ''          # the alchemy name
    rule = ''           # the one rule it changes, in plain words
    does = ''           # what that does in play, in plain words
    kind = 'game'       # 'chemistry' or 'game'
    chem = ''           # cache namespace: set when the chemistry of a (molecule, reagent) changes

    @property
    def name(self):
        return 'sigil:' + self.id


def _c(rule, **kw):
    r = copy.copy(rule)
    for k, v in kw.items():
        setattr(r, k, v)
    return r


# --- chemistry ----------------------------------------------------------------------------------------------------

class Quintessence(Sigil):
    id, title, kind, chem = 'quintessence', 'Quintessence', 'chemistry', 'quint'
    rule = 'A carbon may hold five bonds.'
    does = 'An OH closes a ring on a C=O and the C=O stays: no limit a turn, and the ring never opens again.'

    def setup(self, G):
        def find(mol):
            out = []
            for s in pair_sites(mol, '[#6:1]=[OX1:2]', '[OX2H:3]-[CX4;%s:4]' % ONE_HET, 1, 4, 3, 4, ring='any'):
                c = mol.GetAtomWithIdx(s['A'][1])
                if any(b.GetBondType() == Chem.BondType.DATIVE for b in c.GetBonds()):
                    continue            # five bonds, not six
                if any(n.GetAtomicNum() != 6 for n in c.GetNeighbors() if n.GetIdx() != s['A'][2]):
                    continue            # a ketone or aldehyde carbon only
                out.append(s)
            return out

        def edit(rw, s):
            rw.AddBond(s['A'][1], s['B'][3], Chem.BondType.DATIVE)       # the fifth bond, kept out of RDKit's valence count
        r = GraphRule('quint', find, edit, label='Quint', source='sigil')
        r.prio, r.per_turn = 1, None
        G.self_rules['quint'] = r
        G.near = G.near + ('quint',)


class Ouroboros(Sigil):
    id, title, kind, chem = 'ouroboros', 'Ouroboros', 'chemistry', 'anyring'
    rule = 'A ring may close at any size.'
    does = 'An OH reaches a C=O 3 to 12 carbons away, so rings of 5 to 14 close by themselves.'

    def setup(self, G):
        G.self_rules['ring'] = SC.ring_rule('ring', 3, 12)


class AquaPermanens(Sigil):
    id, title, kind, chem = 'aqua_permanens', 'Aqua Permanens', 'chemistry', 'nowater'
    rule = 'Water never leaves.'
    does = 'Nothing that gives off water can happen: dehydrate finds nothing, and dry, seal, link and knit across are off.'

    def setup(self, G):
        for n, r in list(G.reactions.items()):
            if any('water' in getattr(st, 'off', {}) for st in r.steps):
                G.reactions[n] = Reaction(n, r.label, [st for st in r.steps if 'water' not in getattr(st, 'off', {})], source='sigil')
        wet = {n for n, r in G.self_rules.items() if 'water' in r.off}
        G.near = tuple(n for n in G.near if n not in wet)
        G.far = tuple(n for n in G.far if n not in wet)


class SulphursMask(Sigil):
    id, title, kind, chem = 'sulphurs_mask', "Sulphur's Mask", 'chemistry', 'oass'
    rule = 'Oxygen behaves as sulfur.'
    does = 'An OH closes its ring first and without the limit of two a turn, as an SH does; two OH facing across the fold bridge as O-O.'

    def setup(self, G):
        G.self_rules['ring'] = _c(G.self_rules['ring'], prio=0, per_turn=None)

        def site(mol):
            return F.far_sites(mol, '[OX2H:1]-[CX4:2]', '[OX2H:1]-[CX4:2]', 2, 2, same=True)

        def ed(rw, s):
            rw.AddBond(s['A'][1], s['B'][1], Chem.BondType.SINGLE)
            F.mark_rung(rw, s['A'][1], s['B'][1])
        r = GraphRule('bridge_o', site, ed, off={'hydrogen': 1}, label='Bridge O-O', source='sigil')
        r.prio, r.per_turn, r.twin, r.far = 3, 1, '', True
        G.self_rules['bridge_o'] = r
        G.far = tuple(n for n in G.far if n != 'link') + ('bridge_o',)


class Phlogiston(Sigil):
    id, title, kind, chem = 'phlogiston', 'Phlogiston', 'chemistry', 'phlog'
    rule = 'Hydrogen is shown and can be taken.'
    does = 'Oxidize also takes two H from the carbons beside every C=O: a C=C appears there, and hydrogen comes off.'

    def setup(self, G):
        G.reaction_extra.setdefault('oxidize', []).append(SmartsStep(
            '[%s:1](=[O:2])-[CX4;!H0:3]-[CX4;!H0;!$(C-[!#6]):4]>>[C:1](=[O:2])-[C:3]=[C:4]' % KC, loses='H2', off={'hydrogen': 1},
            max_sites=12))


class Retrograde(Sigil):
    id, title, kind, chem = 'retrograde', 'Retrograde', 'chemistry', 'retro'
    rule = 'Reflexes fire in reverse order.'
    does = 'The ring goes first and the rare groups (N, S, Cl) last; ties go to the farthest pair order reversed.'

    def setup(self, G):
        for n in G.near:
            r = G.self_rules[n]
            G.self_rules[n] = _c(r, prio=2 - getattr(r, 'prio', 1))
        G.near = tuple(reversed(G.near))
        G.far = tuple(reversed(G.far))


class Transmutation(Sigil):
    id, title, kind = 'transmutation', 'Transmutation', 'chemistry'
    rule = 'Once a round one atom becomes the next element.'
    does = 'At the start of a round a CH3 may become NH2, an NH2 an OH, an OH an F, or an SH a Cl: the one that sets off most is taken.'
    OPTS = ('[CH3:1]>>[N:1]', '[NX3H2:1]>>[O:1]', '[SX2H:1]>>[Cl:1]', '[OX2H:1]>>[F:1]')

    def round_start(self, G, R, rng):
        import sweep_perks as SP
        co2 = G.co2_of(R)
        best, top = None, len(G.casc_only(R.smi, (), R.rules, co2))
        for sma in self.OPTS:
            for s in SP.products(R.smi, sma, 12)[:4]:
                n = len(G.casc_only(s, (), R.rules, co2)) + (0.5 if sma == self.OPTS[0] else 0)
                if n > top:
                    best, top = s, n
        if best:
            R.smi = best
            R.x['tap'] = R.x.get('tap', 0) + 1


class Unbound(Sigil):
    id, title, kind, chem = 'unbound', 'Solve', 'chemistry', 'nolimit'
    rule = 'No reflex has a limit a turn.'
    does = 'Dry (once), weld (twice) and ring (twice) go on for as long as they fit.'

    def setup(self, G):
        for n in G.near:
            if getattr(G.self_rules[n], 'per_turn', None) is not None:
                G.self_rules[n] = _c(G.self_rules[n], per_turn=None)


class Fixation(Sigil):
    id, title, kind, chem = 'fixation', 'Coagula', 'chemistry', 'fix'
    rule = 'A ring that closed stays closed.'
    does = 'Loose rings do not open when the page is turned: the molecule keeps every ring, and no ring can be fired twice.'

    def setup(self, G):
        G.p['reopen'] = False


class MagnumOpus(Sigil):
    id, title, kind, chem = 'magnum_opus', 'Magnum Opus', 'chemistry', 'big80'
    rule = 'The molecule may grow to 80 atoms, not 56.'
    does = 'Grow and the other builders keep working where they were blocked.'

    def setup(self, G):
        G.p['max_heavy'] = 80


class Alkahest(Sigil):
    id, title, kind, chem = 'alkahest', 'Alkahest', 'chemistry', 'ether2'
    rule = 'Two OH join by themselves.'
    does = 'Two OH 3 or 4 carbons apart close an ether ring of 5 or 6 and water comes off: a new reflex, at most twice a turn.'

    def setup(self, G):
        oh = '[OX2H:1]-[CX4;%s:2]' % ONE_HET

        def find(mol):
            return pair_sites(mol, oh, oh, 2, 2, 3, 4, ring='lactol', ordered=False)

        def edit(rw, s):
            rw.AddBond(s['A'][1], s['B'][2], Chem.BondType.SINGLE)
            rw.RemoveAtom(s['B'][1])
        r = GraphRule('ether2', find, edit, off={'water': 1}, loses='H2O', label='Ether', source='sigil')
        r.prio, r.per_turn = 1, 2
        G.self_rules['ether2'] = r
        G.near = G.near + ('ether2',)


class ViaHumida(Sigil):
    id, title, kind, chem = 'via_humida', 'Via Humida', 'chemistry', 'anyatom'
    rule = 'Distance is counted through any atom.'
    does = 'The ring reflex counts its 3 or 4 steps through O, N and S too, so groups on either side of an ether or amine reach each other.'

    def setup(self, G):
        G.self_rules['ring'] = SC.ring_rule('ring', 3, 4, through_any=True)


class Serpent(Sigil):
    id, title, kind, chem = 'serpent', 'The Serpent', 'chemistry', 'serpent'
    rule = 'The fold works from round one and has no limit a turn.'
    does = 'Groups facing across the fold join from the first round, each kind as often as it fits.'

    def setup(self, G):
        G.p['far_from'] = 1
        for n in G.far:
            G.self_rules[n] = _c(G.self_rules[n], per_turn=None)


class Hexad(Sigil):
    id, title, kind, chem = 'hexad', 'Hexad', 'chemistry', 'k6'
    rule = 'The fold has rows of six, not eight.'
    does = 'Different groups face each other, and shorter molecules fold: more across joins on small molecules.'

    def setup(self, G):
        G.fold_K = 6


# --- the game -----------------------------------------------------------------------------------------------------

class Gemini(Sigil):
    id, title = 'gemini', 'Gemini'
    rule = 'Every double bond counts twice.'
    does = 'A reagent or reflex that works on a C=C or C=O has its places counted twice.'

    def setup(self, G):
        G.p['dbl_places'] = 2.0


class Rebis(Sigil):
    id, title = 'rebis', 'Rebis'
    rule = 'A reagent fires twice.'
    does = 'Each circle fires its reagent, lets the reflexes run, then fires it again on what is left.'

    def setup(self, G):
        G.p['fire_times'] = 2


class Pansophia(Sigil):
    id, title = 'pansophia', 'Pansophia'
    rule = 'The hand is every reagent carried.'
    does = 'Nothing is dealt: all six (or eight) are on the page every turn.'

    def setup(self, G):
        G.p['hand'] = 99


class Tetractys(Sigil):
    id, title = 'tetractys', 'Tetractys'
    rule = 'A line has four circles.'
    does = 'Four reagents fire a turn; the double pay is after the fourth.'

    def setup(self, G):
        G.p['circles'] = 4


class Clepsydra(Sigil):
    id, title = 'clepsydra', 'Clepsydra'
    rule = 'A round has four pages.'
    does = 'One more turn on every molecule.'

    def setup(self, G):
        G.p['pages'] = 4


class Renovatio(Sigil):
    id, title = 'renovatio', 'Renovatio'
    rule = 'A repeated step pays in full.'
    does = 'Steps up to the longest chain of the round pay as new ones, not a quarter.'

    def setup(self, G):
        G.p['fresh'] = False


class Multiplicatio(Sigil):
    id, title = 'multiplicatio', 'Multiplicatio'
    rule = 'The first reflex of each kind in a round counts three times.'
    does = 'A chain of many different kinds climbs faster than a chain of one kind.'

    def setup(self, G):
        G.p['kind_fresh'] = 2


class Respiratio(Sigil):
    id, title = 'respiratio', 'Respiratio'
    rule = 'The limits a turn start again after every reagent.'
    does = 'Dry, weld and ring may each go their full count after each of the three reagents, not once for the page.'

    def setup(self, G):
        G.p['limits_reset'] = True


class Distillatio(Sigil):
    id, title = 'distillatio', 'Distillatio'
    rule = 'Whatever comes off counts as a reflex step.'
    does = 'Each water, hydrogen, fume or gas that leaves adds one step to the chain of the page.'

    def setup(self, G):
        G.p['runoff_step'] = 1


class Sacrifice(Sigil):
    id, title = 'sacrifice', 'Mortificatio'
    rule = 'Each reagent may be used once a round, and every reflex step pays double.'
    does = 'Three uses become one; the chain is worth twice.'

    def setup(self, G):
        G.p['uses'] = 1
        G.p['uses_free'] = False
        G.p['casc_mul'] = 2.0


class Coniunctio(Sigil):
    id, title = 'coniunctio', 'Coniunctio'
    rule = 'The double pay follows every reagent, not only the last.'
    does = 'Reflexes set off by the first and second circle pay double too, so the order of the line matters less.'

    def setup(self, G):
        G.p['lastx_all'] = True


ALL = [Quintessence, Ouroboros, AquaPermanens, Gemini, Hexad, SulphursMask, Rebis, Phlogiston, Retrograde, Transmutation,
       Unbound, Fixation, MagnumOpus, Pansophia, Tetractys, Clepsydra, Renovatio, Multiplicatio, Alkahest, Respiratio,
       ViaHumida, Serpent, Distillatio, Sacrifice, Coniunctio]
SIGILS = {c.id: c for c in ALL}
ORDER = tuple(c.id for c in ALL)


def make(name):
    if name.startswith('last_'):
        import sigil2_last
        return sigil2_last.make(name[5:])
    return SIGILS[name]()


def selftest():
    ok = True
    # Quintessence: the ring closes, the C=O stays, the SMILES parses again and the spec reader sees the ring
    G = SC.Game(key='t_quint', mods=[make('quintessence')])
    st = G.cascade(chemlib.canon('CC(=O)CCCO'), (), ('quint',), True)
    s = st[0][1] if st else ''
    good = bool(st) and Chem.MolFromSmiles(s) is not None and G.fkey(s, 'rings') == 1 and G.fkey(s, 'g:C=O') >= 0 and '=O' in s
    print('quintessence  CC(=O)CCCO ->', s, 'ok' if good else 'FAILED')
    ok &= good
    G = SC.Game(key='t_ouro', mods=[make('ouroboros')])
    st = G.cascade(chemlib.canon('CC(=O)CCCCCCCCO'), (), ('ring',), True)
    print('ouroboros     CC(=O)CCCCCCCCO ->', st[0][1] if st else None)
    ok &= bool(st)
    G = SC.Game(key='t_aqua', mods=[make('aqua_permanens')])
    print('aqua permanens: dehydrate acts:', G.eng(True).fire(chemlib.canon('CC(O)CC'), 'dehydrate').acted, '; reflexes held:', G.near)
    ok &= not G.eng(True).fire(chemlib.canon('CC(O)CC'), 'dehydrate').acted
    G = SC.Game(key='t_alk', mods=[make('alkahest')])
    st = G.cascade(chemlib.canon('OCCCCO'), (), ('ether2',), True)
    print('alkahest      OCCCCO ->', st[0][1] if st else None)
    ok &= bool(st)
    G = SC.Game(key='t_phl', mods=[make('phlogiston')])
    f = G.eng(True).fire(chemlib.canon('CCCC(=O)C'), 'oxidize')
    print('phlogiston    CCCC(=O)C ->', f.smi, f.off)
    ok &= f.acted
    G = SC.Game(key='t_via', mods=[make('via_humida')])
    st = G.cascade(chemlib.canon('CC(=O)COCO'), (), ('ring',), True)
    print('via humida    CC(=O)COCO ->', st[0][1] if st else None)
    ok &= bool(st)
    for cid in ORDER:
        try:
            g = SC.Game(key='t_' + cid, mods=[make(cid)])
            r = SC.play_run(g, 1, 'bachelor', SC.START_SIX, 'greedy')
            print('%-16s plays: cleared %d of 3' % (cid, r['cleared']))
        except Exception as e:
            ok = False
            print('%-16s FAILED %s: %s' % (cid, type(e).__name__, e))
    return ok


if __name__ == '__main__':
    for c in ALL:
        print('%-16s %-10s %s' % (c.title, c.kind, c.rule))
    print('all ok' if selftest() else 'FAILED')
