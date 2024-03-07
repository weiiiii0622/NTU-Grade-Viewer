from decimal import Decimal
from typing import Optional

from models import GRADES, Grade, GradeElement, Segment, Update
from utils.segment_list import SegmentList


def get_segments(updates: list[Update]):
    if len(updates) and hasattr(updates[0], "grade_id"):
        assert len(updates) and all(update.grade_id == updates[0].grade_id for update in updates)
    updates_solid = [u for u in updates if u.solid]
    if len(updates_solid):
        updates = updates_solid

    total = Decimal(100)
    seglist = SegmentList(size=len(GRADES), total=total)
    for update in updates:
        same = total - update.lower - update.higher
        # print('update:',update )
        seglist.update(update.pos, update.lower, same, update.higher)

    return [Segment.from_iterable(seg) for seg in seglist.dump()]


def get_grade_element(grade: Grade) -> Optional[GradeElement]:

    try:
        # todo: why this error cannot be catched?
        # ! somehow `course` will not be included in `model_dump()`
        return GradeElement(
            course=grade.course, segments=get_segments(grade.updates), **grade.model_dump()
        )
    except:
        return
