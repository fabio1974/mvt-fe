"""Gerador e validador de CPFs para testes (fictícios).

Uso:
  python tools/generate_cpfs.py --count 20

O script gera CPFs válidos (dígitos verificadores corretos). Não use para fins ilegais.
"""
from __future__ import annotations
import random
import argparse


def calculate_verifiers(nums: list[int]) -> tuple[int, int]:
    # nums length should be 9
    def digit(nums_list: list[int]) -> int:
        s = sum([a * b for a, b in zip(nums_list, range(len(nums_list) + 1, 1, -1))])
        r = s % 11
        return 0 if r < 2 else 11 - r

    first = digit(nums)
    second = digit(nums + [first])
    return first, second


def format_cpf(nums: list[int]) -> str:
    s = ''.join(map(str, nums))
    return f"{s[:3]}.{s[3:6]}.{s[6:9]}-{s[9:]}"


def generate_cpf() -> str:
    while True:
        nums = [random.randint(0, 9) for _ in range(9)]
        # Avoid sequences like 000000000
        if len(set(nums)) == 1:
            continue
        v1, v2 = calculate_verifiers(nums)
        full = nums + [v1, v2]
        return format_cpf(full)


def validate_cpf(cpf: str) -> bool:
    # Remove non-digit
    digs = [int(c) for c in cpf if c.isdigit()]
    if len(digs) != 11:
        return False
    # Repetitive sequences are invalid
    if len(set(digs)) == 1:
        return False
    v1, v2 = calculate_verifiers(digs[:9])
    return digs[9] == v1 and digs[10] == v2


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Gerar CPFs válidos (fictícios) para testes')
    parser.add_argument('--count', '-n', type=int, default=20, help='Quantidade de CPFs a gerar')
    args = parser.parse_args()

    cpfs = [generate_cpf() for _ in range(args.count)]
    for c in cpfs:
        print(c)
