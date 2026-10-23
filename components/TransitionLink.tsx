'use client'
import Link from 'next/link'
import type {ComponentProps} from 'react'
import {usePageNavigation} from './RouteTransition'
export default function TransitionLink(props:ComponentProps<typeof Link>){
 const navigate=usePageNavigation()
 return <Link {...props} onClick={e=>{props.onClick?.(e);if(!e.defaultPrevented&&navigate&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&e.button===0){e.preventDefault();navigate(String(props.href))}}}/>
}
