import { IconLoader2 } from "@tabler/icons-react";

export function Loading() {
    return <div className="flex items-center justify-center w-full h-full">
        <IconLoader2 stroke={2} color="#8e8e8e" size={24} className=" animate-spin" />
    </div>
}