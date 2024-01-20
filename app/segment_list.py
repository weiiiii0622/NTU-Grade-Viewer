from dataclasses import dataclass, field
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

T = TypeVar("T", int, float)


@dataclass
class Node(Generic[T]):
    l: int
    r: int
    value: T
    is_nil: bool = False
    next: "Node" = field(default_factory=lambda: f())
    prev: "Node" = field(default_factory=lambda: f())

    def __postinit__(self):
        assert self.l <= self.r

    def __len__(self):
        return self.r - self.l + 1

    def __bool__(self):
        return not self.is_nil


Nil = Node(-1, -1, 0, True, None, None)  # type: ignore


def f():
    return f.__globals__["Nil"]  # some hack to avoid circular reference


def eq(a: T, b: T, error=1):
    return abs(a - b) <= error


class SegmentList(Generic[T]):
    size: int
    total: T
    head: Node[T]

    def __init__(self, size: int, total: T, segments: list[tuple[int, int, T]] = []) -> None:
        self.size = size
        self.total = total
        if not segments:
            self.head = Node(0, size - 1, total)
        else:
            self.head = Node(*segments[0])

            prev = self.head
            for seg in segments[1:]:
                cur = Node(*seg)
                assert cur.l == prev.r + 1
                prev.next = cur
                cur.prev = prev

    def find(self, idx: int):
        """
        Return unique leaf node whose range contains idx.
        """

        cur = self.head
        # print(cur, bool(cur))
        while cur:
            if cur.l <= idx <= cur.r:
                return cur

        raise Exception(f"Idx {idx} not found!")

    def update(self, idx: int, same: T, lower: T, higher: T):
        assert eq(same, self.total - lower - higher)

        cur = self.find(idx)
        # print('found')

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

        assert new_l_val + same + new_r_val == cur.value

        if cur.l < idx:
            new_l: Node[T] = Node(cur.l, idx - 1, new_l_val)
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

    def dump(self) -> list[tuple[int, int, T]]:
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



