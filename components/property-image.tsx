'use client';
import { useEffect, useState } from 'react';
import { TypeIllustration } from './type-illustration';
export function PropertyImage({ src, title, type }: { src?: string; title: string; type: string }) { const [failed,setFailed]=useState(false); useEffect(()=>setFailed(false),[src]); if(!src||failed)return <TypeIllustration type={type}/>; return <img src={src} alt={title} onError={()=>setFailed(true)} className="h-full w-full object-cover"/>; }
