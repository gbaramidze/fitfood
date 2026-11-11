#!/usr/bin/env python3
"""
Excel recipe base  ->  src/data/rationRecipes.json

Reads the kitchen's recipe workbook and exports the dishes that go into the RATIONS
(meal plans) menu. The ration-only dish list lives in WANTED below: every entry is a
short Georgian stem that must match exactly ONE row of the workbook's "dish name" column.

Usage:
    python scripts/import_ration_recipes.py "C:/path/to/recipes.xlsx"

Needs: pip install openpyxl
Then edit src/data/rationDishes.ts if a new dish needs names / photo / schedule slot.
"""
import json
import os
import sys

import openpyxl

# key (used by src/data/rationDishes.ts)  ->  stem of the Georgian dish name in the workbook
WANTED = {
    'omelet-tomato': 'ომლეტი პომიდორით',
    'chicken-cutlets-puree': 'ქათმის კატლეტები პიურესა',
    'cottage-pancakes': 'ხაჭოს პანკეიკები',
    'lazy-curd-balls': 'ზარმაცი ხაჭოს ბურთულები',
    'lazy-tolma-turkey': 'ზარმაცი თოლმა',
    'fish-veg-crust-buckwheat': 'ბოსტნეულის „ქურქით“',
    'potato-souffle-chicken-cheese': 'სუფლე',
    'macaroni-julienne': 'მაკარონი ჟულიენით',
    'braised-cabbage-turkey': 'მოშუშული კომბოსტო',
    'beef-mushroom-stroganoff': 'ბეფსტროგანოვის',
    'plov-chicken': 'ფლავი ქათმით',
    'buckwheat-chicken-merchant': 'წიწიბურა ქათმით',
    'bowl-trout': 'ბოული ოდნავ დამარილებული კალმახით',
    'bowl-chicken-thigh': 'ბოული ქათმის ბარკლით',
    'turkey-hedgehogs': 'ზღარბები',
    'lentil-soup-puree': 'ოსპის სუპი',
    'chicken-broccoli-buckwheat': 'ქათამი ბროკოლით და წიწიბურით',
    'shawarma-burrito': 'შაურმა ქათმით',
}


def lines(cell):
    return [ln.strip() for ln in str(cell or '').replace('\r', '').split('\n') if ln.strip()]


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    wb = openpyxl.load_workbook(sys.argv[1], data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(min_row=2, values_only=True))

    out = {}
    for key, stem in WANTED.items():
        hits = [r for r in rows if r[2] and stem in str(r[2])]
        if len(hits) != 1:
            sys.exit(f'"{key}": stem "{stem}" matched {len(hits)} rows (need exactly 1)')
        r = hits[0]
        out[key] = {
            'nameKa': str(r[2]).strip(),
            'categoryKa': str(r[0]).strip(),
            'ingredientLines': lines(r[3]),
            'methodLines': lines(r[4]),
            'calories': round(float(r[5])),
            'protein': round(float(r[6])),
            'fat': round(float(r[7])),
            'carbs': round(float(r[8])),
        }

    dest = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'rationRecipes.json')
    with open(dest, 'w', encoding='utf-8') as fh:
        json.dump(out, fh, ensure_ascii=False, indent=2)
        fh.write('\n')
    print(f'{len(out)} ration dishes written to {os.path.normpath(dest)}')


if __name__ == '__main__':
    main()
