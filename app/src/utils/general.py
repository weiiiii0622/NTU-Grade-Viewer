"""
General purpose helper funcitons.
"""

from functools import wraps
from typing import Any, Mapping, SupportsIndex


def extract_dict(keys: list[Any], d: Mapping[Any, Any]):
    return {k: d[k] for k in keys if k in d}


a = "現代科學與心靈科學"
b = "現代科學與心靈科學"
# print(a==b)  # False

# print( "力" == "⼒"  ) # False


def edit_distance(s1: str, s2: str) -> int:
    """
    I copypaste this :P
    """

    dp = [[0 for _ in range(len(s2) + 1)] for __ in range(len(s1) + 1)]

    m = len(s1)
    for t1 in range(len(s1) + 1):
        dp[t1][0] = t1

    n = len(s2)
    for t2 in range(len(s2) + 1):
        dp[0][t2] = t2

    # Fill d[][] in bottom up manner
    for i in range(m + 1):
        for j in range(n + 1):

            if i == 0:
                dp[i][j] = j  # Min. operations = j

            # If second string is empty, only option is to
            # remove all characters of second string
            elif j == 0:
                dp[i][j] = i  # Min. operations = i

            # If last characters are same, ignore last char
            # and recur for remaining string
            elif s1[i - 1] == s2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]

            # If last character are different, consider all
            # possibilities and find minimum
            else:
                dp[i][j] = 1 + min(
                    dp[i][j - 1], dp[i - 1][j], dp[i - 1][j - 1]  # Insert  # Remove
                )  # Replace

    return dp[m][n]
