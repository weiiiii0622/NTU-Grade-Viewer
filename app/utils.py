def hashCode(s: str):
    MAGIC = "TH3_M5G1C_OF_NTU" * 3
    magic_idx = []
    cur = 0
    for m in MAGIC:
        cur += ord(m)
        magic_idx.append(cur)

    h = 0
    a = []
    for c in [s[idx] for idx in magic_idx]:
        a.append(ord(c))
        h = (h << 5) - h + ord(c)

        h &= 1 << 63 - 1
        # print(h)

    # print(len(a))
    # print(a)
    return h


# Add student to auth list
def addAuth(studentId: int):
    # ...
    return


# Check student is in auth list
def checkAuth(studentId: str):
    # ...
    return True
