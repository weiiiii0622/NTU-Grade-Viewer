export function FixedBox({ position }: { position: [number, number] }) {
    return (
        <div
            style={{
                position: "fixed",
                left: position[0],
                top: position[1],
                zIndex: 9999,
                backgroundColor: 'white',
            }}
        >
            FIXED
        </div>
    );
}
