
type FixedBoxProps = {
    position: [number, number];
    parent?: HTMLElement
}

export function FixedBox({ position, parent = document.body }: FixedBoxProps) {

    const parentPositionStyle = window.getComputedStyle(parent).position;
    if (parentPositionStyle !== 'absolute' && parentPositionStyle !== 'relative') {
        // throw "Expect parent to be absolute."
    }

    const parentRect = parent.getBoundingClientRect()
    const left = position[0] - parentRect.x;
    const top = position[1] - parentRect.y;
    const curZIndex = window.getComputedStyle(document.elementFromPoint(...position)!).zIndex

    return (
        <div
            style={{
                position: "absolute",
                left: left,
                top: top,
                zIndex: 9999,
                backgroundColor: 'white',
            }}
        >
            FIXED
        </div>
    );
}
