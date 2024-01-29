from db import insert_courses, insert_grade_elements
from models import GRADE_MAP_INV, Course, GradeElement, GradeInfo, Segment
from segment_list import SegmentList


def handle_grade_infos(results: list[tuple[Course, GradeInfo]]):
    insert_courses([c for c, _ in results])

    def grade_info_to_ele(course: Course, info: GradeInfo):
        seg_list = SegmentList(10, 100.0)
        seg_list.update(GRADE_MAP_INV[info.grade], *info.dist)
        segments = [Segment.from_iterable(seg) for seg in seg_list.dump()]

        ele = GradeElement(
            course_id1=info.course_id1,
            semester=info.semester,
            lecturer=info.lecturer,
            class_id=info.class_id,
            segments=segments,
        )

        return ele

    grade_eles = [grade_info_to_ele(c, g) for c, g in results]
    insert_grade_elements(grade_eles)
