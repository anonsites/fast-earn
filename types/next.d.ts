declare module 'next/link' {
  import { ReactNode, AnchorHTMLAttributes } from 'react'

  interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
    href: string
    replace?: boolean
    scroll?: boolean
    prefetch?: boolean | null
    children?: ReactNode
  }

  export default function Link(props: LinkProps): JSX.Element
}

declare module 'next/navigation' {
  import { ReactNode } from 'react'

  export interface NavigateOptions {
    scroll?: boolean
  }

  export function useRouter(): {
    push: (href: string, options?: NavigateOptions) => void
    replace: (href: string, options?: NavigateOptions) => void
    refresh: () => void
    back: () => void
    forward: () => void
    prefetch: (href: string) => void
  }

  export function usePathname(): string

  export function useSearchParams(): URLSearchParams

  export function useParams(): Record<string, string | string[]>

  export function redirect(url: string): never

  export function notFound(): never

  export class NextRequest extends Request {
    nextUrl: URL
  }

  export class NextResponse extends Response {
    static json(
      body: any,
      init?: ResponseInit
    ): NextResponse
    static redirect(
      url: string | URL,
      init?: ResponseInit | number
    ): NextResponse
    static next(init?: ResponseInit): NextResponse
  }
}

declare module 'next/server' {
  export { NextRequest, NextResponse } from 'next/navigation'
}
