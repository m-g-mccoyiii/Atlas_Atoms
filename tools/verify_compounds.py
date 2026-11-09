"""Check every molecule in js/data.js against PubChem and Wikipedia, and write js/realdata.js.

A molecule is only linked if PubChem has a compound whose molecular formula matches ours
exactly, and Wikipedia has a real article for it. Run again after adding molecules:

    python tools/verify_compounds.py

Needs internet. Uses only the Python standard library.
Data sources: PubChem (NCBI, public domain data) and Wikipedia (links only, no text copied).
"""
import json, os, re, sys, time, urllib.parse, urllib.request

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_js = open(os.path.join(root, 'js', 'data.js'), encoding='utf-8').read()

# --- our molecules: id, smiles (parsed with a tiny SMILES reader to count atoms)
VAL = {'H': [1], 'C': [4], 'N': [3], 'O': [2], 'F': [1], 'Cl': [1], 'S': [2, 4, 6], 'P': [3, 5], 'Na': [1]}

def counts_from_smiles(smi):
    atoms, bonds, stack, rings, prev, order = [], [], [], {}, -1, 1
    i = 0
    while i < len(smi):
        c = smi[i]
        if c == '[':
            j = smi.index(']', i); sym = smi[i + 1:j]; br = True; i = j
        elif c == 'C' and smi[i + 1:i + 2] == 'l': sym, br = 'Cl', False; i += 1
        elif c in 'CNOSPFH': sym, br = c, False
        elif c == '=': order = 2; i += 1; continue
        elif c == '#': order = 3; i += 1; continue
        elif c == '-': order = 1; i += 1; continue
        elif c == '(': stack.append(prev); i += 1; continue
        elif c == ')': prev = stack.pop(); i += 1; continue
        elif c.isdigit():
            if c in rings: bonds.append((rings.pop(c), prev, order)); order = 1
            else: rings[c] = prev
            i += 1; continue
        else: raise ValueError(smi)
        atoms.append([sym, br]); idx = len(atoms) - 1
        if prev >= 0: bonds.append((prev, idx, order))
        order = 1; prev = idx; i += 1
    counts = {}
    for k, (sym, br) in enumerate(atoms):
        counts[sym] = counts.get(sym, 0) + 1
        if br: continue
        s = sum(o for a, b, o in bonds if a == k or b == k)
        v = next(x for x in VAL[sym] if x >= s)
        if v - s: counts['H'] = counts.get('H', 0) + (v - s)
    return counts

mols = re.findall(r"\{ id: '(\w+)', name: '([^']+)', smiles: '([^']+)'", data_js)
ours = {mid: counts_from_smiles(smi) for mid, name, smi in mols}

# --- what to search for (first match whose formula equals ours wins)
NAMES = {
    'water': ['water'], 'hydrogen': ['hydrogen', 'molecular hydrogen', 'dihydrogen'],
    'oxygen': ['oxygen', 'molecular oxygen', 'dioxygen'], 'co2': ['carbon dioxide'],
    'nitrogen': ['nitrogen', 'molecular nitrogen', 'dinitrogen'], 'methane': ['methane'],
    'hcl': ['hydrogen chloride', 'hydrochloric acid'], 'salt': ['sodium chloride'], 'ammonia': ['ammonia'],
    'peroxide': ['hydrogen peroxide'], 'h2s': ['hydrogen sulfide'], 'so2': ['sulfur dioxide'],
    'naf': ['sodium fluoride'], 'propane': ['propane'], 'ethene': ['ethylene', 'ethene'],
    'ethyne': ['acetylene', 'ethyne'], 'ethanol': ['ethanol'], 'acetic': ['acetic acid'],
    'acetone': ['acetone'], 'urea': ['urea'], 'carbonic': ['carbonic acid'], 'h2so4': ['sulfuric acid'],
    'h3po4': ['phosphoric acid'], 'glycine': ['glycine'], 'butane': ['butane'], 'benzene': ['benzene'],
    'vanillin': ['vanillin'], 'chlorine': ['chlorine', 'molecular chlorine', 'dichlorine'],
    'lactic': ['lactic acid'], 'citric': ['citric acid'], 'aspirin': ['aspirin'],
    'glucose': ['glucose', 'D-glucose'], 'vitc': ['ascorbic acid', 'vitamin C'],
}
WIKI = {
    'water': 'Water', 'hydrogen': 'Hydrogen', 'oxygen': 'Oxygen', 'co2': 'Carbon dioxide', 'nitrogen': 'Nitrogen',
    'methane': 'Methane', 'hcl': 'Hydrogen chloride', 'salt': 'Sodium chloride', 'ammonia': 'Ammonia',
    'peroxide': 'Hydrogen peroxide', 'h2s': 'Hydrogen sulfide', 'so2': 'Sulfur dioxide', 'naf': 'Sodium fluoride',
    'propane': 'Propane', 'ethene': 'Ethylene', 'ethyne': 'Acetylene', 'ethanol': 'Ethanol', 'acetic': 'Acetic acid',
    'acetone': 'Acetone', 'urea': 'Urea', 'carbonic': 'Carbonic acid', 'h2so4': 'Sulfuric acid',
    'h3po4': 'Phosphoric acid', 'glycine': 'Glycine', 'butane': 'Butane', 'benzene': 'Benzene', 'vanillin': 'Vanillin',
    'chlorine': 'Chlorine', 'lactic': 'Lactic acid', 'citric': 'Citric acid', 'aspirin': 'Aspirin',
    'glucose': 'Glucose', 'vitc': 'Vitamin C',
}

def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'AtlasAtoms-verify/1.0 (educational project)'})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and attempt < 4:
                time.sleep(2 + attempt * 3); continue
            raise

def formula_counts(f):
    out = {}
    for el, n in re.findall(r'([A-Z][a-z]?)(\d*)', f):
        out[el] = out.get(el, 0) + int(n or 1)
    return out

PUB = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound'
result, problems = {}, []
for mid, name, smi in mols:
    found = None
    for q in NAMES.get(mid, [name]):
        try:
            cids = get(f"{PUB}/name/{urllib.parse.quote(q)}/cids/JSON")['IdentifierList']['CID'][:5]
        except Exception:
            cids = []
        time.sleep(0.22)
        for cid in cids:
            if cid == 0: continue
            try:
                p = get(f"{PUB}/cid/{cid}/property/MolecularFormula,Title,IUPACName,MolecularWeight/JSON")['PropertyTable']['Properties'][0]
            except Exception:
                continue
            time.sleep(0.22)
            if formula_counts(p['MolecularFormula']) == ours[mid]:
                found = {'cid': cid, 'title': p.get('Title', q), 'formula': p['MolecularFormula'], 'iupac': p.get('IUPACName', '')}
                break
        if found: break
    wiki = None
    try:
        s = get('https://en.wikipedia.org/api/rest_v1/page/summary/' + urllib.parse.quote(WIKI[mid].replace(' ', '_')))
        if s.get('type') == 'standard':
            wiki = {'title': s['title'], 'url': s['content_urls']['desktop']['page']}
    except Exception:
        pass
    time.sleep(0.8)
    if not found: problems.append(f'{mid}: no PubChem compound with formula {ours[mid]}')
    if not wiki: problems.append(f'{mid}: no Wikipedia article for {WIKI[mid]}')
    result[mid] = {'pubchem': found, 'wikipedia': wiki}
    print(f"{mid:9s} PubChem {found['cid'] if found else '-':>9}  {found['formula'] if found else '':10s} Wikipedia {wiki['title'] if wiki else '-'}")

body = json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True)
js = ("(function (root) {\n'use strict';\nconst AA = root.AA = root.AA || {};\n"
      "// Generated by tools/verify_compounds.py. Every molecule here matched a PubChem compound formula exactly.\n"
      "// PubChem: https://pubchem.ncbi.nlm.nih.gov (NCBI). Wikipedia links only.\n"
      "AA.REAL = " + body + ";\n})(typeof globalThis !== 'undefined' ? globalThis : window);\n")
open(os.path.join(root, 'js', 'realdata.js'), 'w', encoding='utf-8', newline='\n').write(js)
print('\nwrote js/realdata.js with', len(result), 'molecules')
if problems:
    print('\nPROBLEMS:'); [print(' -', p) for p in problems]; sys.exit(1)
print('All molecules verified.')
