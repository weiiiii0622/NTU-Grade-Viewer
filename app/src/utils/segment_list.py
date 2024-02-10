import math
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Generic, TypeVar

# ? Cool but not neccessary
# class SupportArithmetic(Protocol):
#     def __abs__(self)->Self:
#         raise NotImplementedError
#     def __add__(self,b:Self, /)->Self:
#         raise NotImplementedError
#     def __mul__(self,b:Self, /)->Self:
#         raise NotImplementedError
#     def __sub__(self,b:Self, /)->Self:
#         raise NotImplementedError


@dataclass
class Node:
    l: int
    r: int
    value: Decimal
    is_nil: bool = False
    next: "Node" = field(default_factory=lambda: f())
    prev: "Node" = field(default_factory=lambda: f())

    def __postinit__(self):
        assert self.l <= self.r

    def __len__(self):
        return self.r - self.l + 1

    def __bool__(self):
        return not self.is_nil


Nil = Node(-1, -1, 0.0, True, None, None)  # type: ignore


def f():
    return f.__globals__["Nil"]  # some hack to avoid circular reference


class SegmentList:
    size: int
    total: Decimal
    head: Node
    err: Decimal

    def __init__(
        self,
        size: int,
        total: Decimal,
        segments: list[tuple[int, int, Decimal]] | None = None,
        err: Decimal | None = None,
        strict=True,
    ) -> None:
        self.size = size
        self.total = total
        if not err:
            err = total * Decimal("0.01")
        self.err =err
        if not segments:
            self.head = Node(0, size - 1, total)
        else:
            self.head = Node(*segments[0])

            prev = self.head
            for seg in segments[1:]:
                cur = Node(*seg)
                if strict:
                    assert cur.l == prev.r + 1
                prev.next = cur
                cur.prev = prev

    def find(self, idx: int):
        """
        Return unique leaf node whose range contains idx.
        """

        cur = self.head
        while cur:
            if cur.l <= idx <= cur.r:
                return cur
            cur = cur.next

        # print(self.dump())
        # exit(0)

        raise Exception(f"Idx {idx} not found!")

    def remove(self, l: int, r: int, value: Decimal):
        """
        Use to find the "empty" ranges.
        ex. removing [0, 0], [2, 3] from [0, 3], find out [1, 1] is empty.
        This should only be used for parsing pre-collected data, not new submitted data.
        Note this operation will mess up the `value`.
        """

        assert self.head != Nil

        # print(f'remove {l},{r}')
        # print('before: ', self.dump())

        assert 0 <= l <= r < self.size

        p = self.find(l)
        assert p.l <= r <= p.r

        if l == p.l and r == p.r:
            # remove
            if p == self.head and p.next == p:
                self.head = Nil  # type: ignore
            else:
                if p == self.head:
                    self.head = p.next
                p.prev.next = p.next
                p.next.prev = p.prev
                del p
        elif l == p.l:
            p.l = r + 1
        elif r == p.r:
            p.r = l - 1
        else:
            # split
            new_node = Node(r + 1, p.r, Decimal(0))
            p.r = l - 1
            p.next.prev = new_node
            new_node.next = p.next
            new_node.prev = p
            p.next = new_node

        # print('after: ', self.dump())

    def update(self, idx: int, lower: Decimal, same: Decimal, higher: Decimal):
        assert math.isclose(same, self.total - lower - higher, abs_tol=self.err)

        cur = self.find(idx)

        new_l_val = lower
        prev = cur.prev
        while prev:
            new_l_val -= prev.value
            prev = prev.prev

        new_r_val = higher
        nxt = cur.next
        while nxt:
            new_r_val -= nxt.value
            nxt = nxt.next

        assert math.isclose(
            new_l_val + same + new_r_val, cur.value, abs_tol=self.err
        ), f"{new_l_val}, {same}, {new_r_val}"

        if cur.l < idx:
            new_l: Node = Node(cur.l, idx - 1, new_l_val)
            cur.prev.next = new_l
            new_l.prev = cur.prev

            cur.prev = new_l
            new_l.next = cur

            if cur == self.head:
                self.head = new_l

        if cur.r > idx:
            new_r = Node(idx + 1, cur.r, new_r_val)
            cur.next.prev = new_r
            new_r.next = cur.next

            cur.next = new_r
            new_r.prev = cur

        cur.value = same
        cur.l = idx
        cur.r = idx

    def dump(self) -> list[tuple[int, int, Decimal]]:
        results = []
        cur = self.head
        while cur:
            results.append((cur.l, cur.r, cur.value))
            cur = cur.next

        return results

    # ? The segment tree will not working...
    # def update(self, cur: Node, l: int, r: int, value: T):
    #     assert cur.l <= l <= r <= cur.r
    #     assert value <= cur.value

    #     if l == cur.l and r == cur.r:
    #         assert value == cur.value
    #         return

    #     # New node will be create if current range is least

    #     node_l: Optional[Node] = None
    #     node_r: Optional[Node] = None

    #     node: Optional[Node] = cur.child

    #     if not node:
    #         pass

    #     while node:
    #         if node.l <= l <= r <= node.r:
    #             self.update(node, l, r, value)
    #             return
    #         elif node.l <= l <= node.r <= r:
    #             if node_l:
    #                 raise Exception("unexpected node_l: not nil")
    #             node_l = node
    #         elif l <= node.l <= r <= node.r:
    #             if node_l:
    #                 raise Exception("unexpected node_l: nil")
    #             if node_r:
    #                 raise Exception("unexpected node_r: not nil")
    #             node_r = node
    #             break
    #         elif node.l <= l <= r <= node.r:
    #             # this update does not provide useful information
    #             return

    #         node = node.next

    #     assert node_l and node_r
    #     assert node_l.next == node_r
    #     assert node_l.r + 1 == node_r.l

    #     new_node = Node(l, r, value)

    #     cur_cost = cost_func([len(node_l), len(node_r)])
    #     new_cost = cost_func(
    #         [len(node_l) - len(new_node), len(new_node), len(node_r) - len(new_node)]
    #     )
    #     if new_cost > cur_cost:
    #         return
    #     node_l.r = l - 1
    #     node_r.l = r + 1
