"use client";
import Image from "next/image";
import React from 'react';
import AnnouncementList from "@/components/AnnouncementList";
import { motion } from 'framer-motion';

export default function HomePageClient() {
    return (
        <div className="w-full bg-slate-50 font-sans min-h-screen">
            
            <div className="relative w-full">
                <Image
                    src="/banner.jpg"
                    alt="NCUE Banner"
                    width={4000}
                    height={862}
                    priority
                    className="w-full h-auto"
                    onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/4000x862/e2e8f0/475569?text=Banner+Image'; }}
                />
            </div>

            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="w-full mt-16 mb-16">
                    <motion.h2 
                        className="text-3xl font-bold mb-8 text-center text-slate-800"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.5 }}
                    >
                        獎助學金公告一覽表
                    </motion.h2>
                    <AnnouncementList />
                </div>
            </main>
        </div>
    );
}
