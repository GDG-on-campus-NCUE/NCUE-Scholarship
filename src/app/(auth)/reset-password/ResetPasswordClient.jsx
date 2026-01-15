"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/profile");
    }, [router]);

    return <p>正在重新導向...</p>;
}