

import { } from './foo'

import { useEffect, useState } from "react";
import { History, sendRuntimeMessage } from "../api";
import { CourseBase, CourseReadWithGrade } from "../client";

import "../style.css";
import { getSortedCourses } from "./utils";
import { ItemList, ItemProps } from './itemList';


export function RecentItemsSection({
    histories,
    // items,
    itemOnClickFactory }: {
        histories: History[],
        // items: ItemProps[],
        itemOnClickFactory: (courseId1: CourseBase['id1']) => () => void,
    }) {

    // todo: loading state

    const [items, setItems] = useState<ItemProps[]>([]);
    useEffect(() => {
        if (!histories) {
            setItems([]);
            return;
        }
        // console.log('dispatch')

        let cancel = false;
        // const newItems: ItemProps[] = [];
        const courses: CourseReadWithGrade[] = [];
        // todo: currently all need to re-fetch when re-render. 
        Promise.all(histories.sort((a, b) => b.timeStamp - a.timeStamp).map(async history => {
            const { courseId1: id1 } = history;
            const [course, error] = await sendRuntimeMessage('service', { funcName: 'getCourseCourseId1Get', args: { id1 } });
            // console.log(course, error);
            if (course) {
                // newItems.push({
                //    type: 'recent',
                //    course,
                //    count: course.grades.length,
                //    onClick: itemOnClickFactory(course.id1),
                // });
                courses.push(course);
            }

            // ? not directly return because there may be fetching error
            // return course;
        })).then(() => {
            if (!cancel) {
                const newItems = getSortedCourses(courses, histories).map(course => (
                    {
                        type: 'recent' as const,
                        course,
                        count: new Set(course.grades.map(g => g.class_id)).size,
                        onClick: itemOnClickFactory(course.id1),
                    }
                ))
                setItems(newItems);
            } else
                console.log('canceled, not set');

        })

        return () => { console.log('cancel'); cancel = true };
    }, [histories]);


    return <>
        <ItemList
            title="最近搜尋"
            items={items}
        />
    </>
}
