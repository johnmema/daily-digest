'use client'
import {createContext,useContext,useLayoutEffect,useRef,type ReactNode} from 'react'
import {usePathname,useRouter} from 'next/navigation'
const NavigationContext=createContext<((href:string)=>void)|null>(null)
export const usePageNavigation=()=>useContext(NavigationContext)
export default function RouteTransition({children}:{children:ReactNode}){
 const router=useRouter(),pathname=usePathname(),pending=useRef<null|(()=>void)>(null)
 useLayoutEffect(()=>{pending.current?.();pending.current=null},[pathname])
 const navigate=(href:string)=>{
  const doc=document as Document&{startViewTransition?:(update:()=>Promise<void>)=>unknown}
  if(!doc.startViewTransition||matchMedia('(prefers-reduced-motion: reduce)').matches){router.push(href);return}
  doc.startViewTransition(()=>new Promise<void>(resolve=>{pending.current=resolve;router.push(href);setTimeout(resolve,1500)}))
 }
 return <NavigationContext.Provider value={navigate}>{children}</NavigationContext.Provider>
}
