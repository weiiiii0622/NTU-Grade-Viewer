


import { IconChevronLeft, IconChevronRight, IconUser } from "@tabler/icons-react";
import { CourseBase, CourseReadWithGrade, GradeWithSegments, Segment } from "../client";

import "../style.css";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { sendRuntimeMessage } from "../api";
import { IChartData, PieChart } from "../components/gradeChart";
import { GRADES, semesterCompareFn } from "../utils";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../components/shadcn-ui/select";
import { CloseBtn } from "./dialog";


export type ChartType = 'pie' | 'bar';


function ChartWrapper(props: { type: ChartType, segments: Segment[] }) {

    const { type, segments } = props;

    const getLabel = (seg: Segment) => seg.l === seg.r ? `${GRADES[seg.l]}` : `${GRADES[seg.r]} -  ${GRADES[seg.l]}`;

    const datas: IChartData[] = useMemo(() => {
        return segments.map<IChartData>(seg => {
            return { label: getLabel(seg), value: parseFloat(seg.value) };
        })
    }, [segments]);


    const chartMap: Record<ChartType, ReactNode> = {
        'pie': <PieChart
            datas={datas}
            width={180}
            height={180}
        />,
        'bar': <>bar chart</>
    };

    return <div className="flex items-center justify-between p-2">
        {chartMap[type]}
        <div>
            Legend
        </div>
    </div>
}


function getSortedSemesters(grades: GradeWithSegments[]): string[] {
    return grades.map(g => g.semester).sort(semesterCompareFn);
}

type ClassKey = {
    lecturer: string;
    classId: string;
}


export type ChartPageProps = {
    // grades: GradeElement[];
    courseId1: CourseBase['id1'];
    defaultClassKey: ClassKey | null;  // todo: save in storage
    defaultChartType: ChartType;
    // todo: store semester 

    goBack: () => void;
    close: () => void;
}

export function ChartPage(props: ChartPageProps) {
    const { goBack, close } = props;

    const [error, setError] = useState(false);

    const [course, setCourse] = useState<CourseReadWithGrade | null>(null);
    const [classIdx, setClassIdx] = useState<number>(-1);
    // const [semester, setSemester] = useState('');
    const [semesterIdx, setSemesterIdx] = useState(-1);
    const [chartType, setChartType] = useState<ChartType>('pie');

    const { courseId1, defaultChartType, defaultClassKey } = props;
    useEffect(() => {
        let canceled = false;
        sendRuntimeMessage('service', { funcName: 'getCourseCourseId1Get', args: { 'id1': courseId1 } }).then(([course, error]) => {
            if (canceled)
                return;
            if (error) {
                setError(true);
                return;
            }

            const { grades } = course;
            const classes: ClassKey[] = grades.map(g => ({ classId: g.class_id, lecturer: g.lecturer }));
            const classIdx = classes.findIndex(c =>
                c.classId === defaultClassKey?.classId && c.lecturer === defaultClassKey.lecturer);
            setCourse(course);
            // setClasses(classes);
            // // setClassIdx(classIdx === -1 ? 0 : classIdx);
            // updateClassIdx(classIdx === -1 ? 0 : classIdx);
            // setChartType(defaultChartType);
        })
        return () => {
            canceled = true;
        }
    }, [courseId1]);

    // console.log(course);

    if (error)
        return <>
            error!
        </>

    // todo: maybe passing previous fetched title, so only body part will be loading 
    if (!course)
        return <>
            loading...
        </>


    const { grades, id1, id2, title } = course;
    const classes: ClassKey[] = grades.map(g => ({ classId: g.class_id, lecturer: g.lecturer }))
        .reduce<ClassKey[]>((prev, cur) => {
            return prev.find(cls => cls.classId === cur.classId && cls.lecturer === cur.lecturer)
                ? prev : [...prev, cur];
        }, []);

    const getGradesFiltered = (classKey: ClassKey) =>
        grades.filter(g =>
            g.class_id === classKey.classId && g.lecturer === classKey.lecturer
        );

    function init() {
        const classIdx = classes.findIndex(c =>
            c.classId === defaultClassKey?.classId && c.lecturer === defaultClassKey.lecturer);

        updateClassIdx(classIdx === -1 ? 0 : classIdx);
        setChartType(defaultChartType);
    }
    if (classIdx === -1) {
        init();
        return <>
            loading...
        </>
    }

    function updateClassIdx(classIdx: number) {
        console.log("cls:", classes, classIdx);
        setClassIdx(classIdx);

        const gradesFiltered = getGradesFiltered(classes[classIdx]);
        // console.log("update: ", gradesFiltered, semester, semesters[0]);
        // todo: if same semester exist, do not change
        setSemesterIdx(0);  // todo: default semester?
    }

    const classKey = classes[classIdx];
    console.log(classIdx, classKey);
    const gradesFiltered = getGradesFiltered(classKey);
    const semesters = getSortedSemesters(gradesFiltered);
    const semester = semesters[semesterIdx];
    const activeGrade = gradesFiltered.find(g => g.semester === semester);


    console.log('grades', grades, gradesFiltered)
    console.log('classes:', classes);
    console.log(classKey);
    console.log('semester:', semester);


    if (!gradesFiltered || !semesters) {
        console.log(grades);
        return <>Error! </>
    }
    if (!semester)
        return <>Error!</>;
    if (!activeGrade)
        return <>Error!</>


    return <div className="flex flex-col h-full" >
        <header className="flex flex-row items-center w-full gap-2 mb-8" >
            <IconChevronLeft size={24} stroke={1.8} color="#4e4e4e"
                onClick={goBack}
                className="hover:cursor-pointer"
            />
            <div className="flex flex-row items-center gap-2">
                <h3 className="text-[#4e4e4e] font-semibold text-xl">{title}</h3>
                <div className="text-[#909090]/[.82] text-sm">{id1}</div>
            </div>
            <CloseBtn onClick={close} className="ml-auto" />
        </header>
        <main className="flex flex-col h-full px-2 ">
            <div className="pb-3  border-solid border-b-[#e8e8e8] border-b flex flex-row items-center justify-between">
                <Select
                    // defaultValue={`${classIdx}`}
                    onValueChange={(val) => {
                        updateClassIdx(parseInt(val));
                    }}
                    value={`${classIdx}`}
                >
                    <SelectTrigger className="w-[180px]">
                        <IconUser stroke={1} color="#909090" size={18} />
                        <SelectValue>
                            <div>{classKey.lecturer}&nbsp;{classKey.classId} </div>
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {classes.map((cls, i) => {
                                return <SelectItem key={`class-${i}`} value={`${i}`}>
                                    {`${cls.lecturer} ${cls.classId}`}
                                </SelectItem>
                            })}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <div>toggle</div>
            </div>
            <div className="flex flex-col items-center justify-between flex-1">
                <ChartWrapper
                    type={chartType}
                    segments={activeGrade.segments}
                />

                <div>
                    <Btn
                        onClick={() => setSemesterIdx(s => s - 1)}
                        disabled={semesterIdx === 0}
                    >
                        <IconChevronLeft size={24} stroke={1.8} color="#4e4e4e"
                        // className="hover:cursor-pointer"
                        />
                    </Btn>
                    {semester}
                    <Btn
                        onClick={() => setSemesterIdx(s => s + 1)}
                        disabled={semesterIdx === semesters.length - 1}
                    >
                        <IconChevronRight size={24} stroke={1.8} color="#4e4e4e"
                        // className="hover:cursor-pointer"
                        />
                    </Btn>
                </div>
            </div>
        </main>
    </div >
}

function Btn({ children, ...props }: React.ComponentProps<'button'>) {
    return <button {...props}>
        {children}
    </button>
}