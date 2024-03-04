import { IconExclamationCircle } from "@tabler/icons-react";

export function Error() {
    return <div className="flex flex-col items-center justify-center w-full h-full">
        <IconExclamationCircle size={30} stroke={1.5} />
        <div className=" font-medium text-[#4e4e4e]">發生錯誤，請稍後重試</div>
    </div>
}

export function AuthError() {
    return <div className="flex flex-col items-center justify-center w-full h-full">
        <IconExclamationCircle size={30} stroke={1.5} />
        <div className=" font-medium text-[#4e4e4e]">請先點選小工具註冊後重試</div>
    </div>
}