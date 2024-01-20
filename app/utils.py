def hashCode(s: str):
    h = 0
    for c in s:
        h = (h << 5) - h + ord(c)
        h |= 0
    return h
