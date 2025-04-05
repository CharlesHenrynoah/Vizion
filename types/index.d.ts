declare module 'react' {
  export type FC<P = {}> = FunctionComponent<P>;
  export interface FunctionComponent<P = {}> {
    (props: P, context?: any): ReactElement<any, any> | null;
    propTypes?: any;
    contextTypes?: any;
    defaultProps?: Partial<P>;
    displayName?: string;
  }
  export interface ReactElement<P = any, T = any> {
    type: T;
    props: P;
    key: string | null;
  }
  
  type ReactText = string | number;
  type ReactChild = ReactElement | ReactText;
  
  interface ReactNodeArray extends Array<ReactNode> {}
  type ReactFragment = {} | ReactNodeArray;
  export type ReactNode = ReactChild | ReactFragment | boolean | null | undefined;
  
  export type FormEvent<T = Element> = Event;
  export type ChangeEvent<T = Element> = Event & {
    target: T;
    currentTarget: T;
  };
  
  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useContext<T>(context: any): T;
  export function forwardRef<T, P = {}>(render: (props: P, ref: any) => ReactElement | null): FC<P>;
  export function createElement(type: any, props?: any, ...children: any[]): ReactElement;
  export const Fragment: unique symbol;
  export function createContext<T>(defaultValue: T): React.Context<T>;
  
  export interface Context<T> {
    Provider: Provider<T>;
    Consumer: Consumer<T>;
    displayName?: string;
  }
  
  export interface Provider<T> {
    props: {
      value: T;
      children?: ReactNode;
    };
  }
  
  export interface Consumer<T> {
    props: {
      children: (value: T) => ReactNode;
    };
  }
  
  export type ElementRef<C> = C extends { current: infer T } ? T : never;
  export type ComponentPropsWithoutRef<T> = T extends new (...args: any) => any ? Omit<React.ComponentProps<T>, 'ref'> : T extends (...args: any) => any ? Parameters<T>[0] : never;
  export type ComponentProps<T> = T extends new (...args: any) => any ? React.ClassAttributes<InstanceType<T>> & ConstructorParameters<T>[0] : T extends (...args: any) => any ? Parameters<T>[0] : never;
  
  export interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    accept?: string;
    alt?: string;
    autoComplete?: string;
    autoFocus?: boolean;
    capture?: boolean | string;
    checked?: boolean;
    disabled?: boolean;
    form?: string;
    formAction?: string;
    formEncType?: string;
    formMethod?: string;
    formNoValidate?: boolean;
    formTarget?: string;
    height?: number | string;
    list?: string;
    max?: number | string;
    maxLength?: number;
    min?: number | string;
    minLength?: number;
    multiple?: boolean;
    name?: string;
    pattern?: string;
    placeholder?: string;
    readOnly?: boolean;
    required?: boolean;
    size?: number;
    src?: string;
    step?: number | string;
    type?: string;
    value?: string | ReadonlyArray<string> | number;
    width?: number | string;
  }
  
  export interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
    autoComplete?: string;
    autoFocus?: boolean;
    cols?: number;
    dirName?: string;
    disabled?: boolean;
    form?: string;
    maxLength?: number;
    minLength?: number;
    name?: string;
    placeholder?: string;
    readOnly?: boolean;
    required?: boolean;
    rows?: number;
    value?: string | ReadonlyArray<string> | number;
    wrap?: string;
  }
  
  export interface HTMLAttributes<T> {
    className?: string;
    dangerouslySetInnerHTML?: {
      __html: string;
    };
    id?: string;
    role?: string;
    style?: React.CSSProperties;
    tabIndex?: number;
    title?: string;
  }
  
  export interface CSSProperties {
    [key: string]: string | number | undefined;
  }
}

declare module 'next/navigation' {
  export function useRouter(): {
    push: (url: string) => void;
    replace: (url: string) => void;
    back: () => void;
  };
  export function useSearchParams(): URLSearchParams;
  export function redirect(url: string): never;
}

declare module 'next-auth/react' {
  export function useSession(): {
    data: any;
    status: 'loading' | 'authenticated' | 'unauthenticated';
  };
  export function signIn(provider?: string, options?: any): Promise<any>;
  export function signOut(options?: any): Promise<any>;
}

declare module 'lucide-react' {
  import { FC } from 'react';
  export const AlertCircle: FC<any>;
  export const ArrowDown: FC<any>;
  export const ArrowUp: FC<any>;
  export const Check: FC<any>;
  export const ChevronDown: FC<any>;
  export const ChevronRight: FC<any>;
  export const ChevronUp: FC<any>;
  export const Clock: FC<any>;
  export const Copy: FC<any>;
  export const Edit: FC<any>;
  export const Flag: FC<any>;
  export const ListPlus: FC<any>;
  export const Loader2: FC<any>;
  export const MessageSquare: FC<any>;
  export const MoreHorizontal: FC<any>;
  export const Pencil: FC<any>;
  export const Plus: FC<any>;
  export const RefreshCw: FC<any>;
  export const Search: FC<any>;
  export const Sparkles: FC<any>;
  export const Ticket: FC<any>;
  export const Trash: FC<any>;
  export const Trash2: FC<any>;
  export const X: FC<any>;
}

declare module '@hello-pangea/dnd' {
  import { FC, ReactNode } from 'react';
  
  export interface DroppableProvided {
    innerRef: (element: HTMLElement | null) => void;
    droppableProps: {
      [key: string]: any;
    };
    placeholder?: ReactNode;
  }
  
  export interface DraggableProvided {
    innerRef: (element: HTMLElement | null) => void;
    draggableProps: {
      [key: string]: any;
    };
    dragHandleProps: {
      [key: string]: any;
    } | null;
  }
  
  export interface DragDropContextProps {
    onDragEnd: (result: any) => void;
    children: ReactNode;
  }
  
  export interface DroppableProps {
    droppableId: string;
    type?: string;
    children: (provided: DroppableProvided) => ReactNode;
  }
  
  export interface DraggableProps {
    draggableId: string;
    index: number;
    children: (provided: DraggableProvided) => ReactNode;
  }
  
  export const DragDropContext: FC<DragDropContextProps>;
  export const Droppable: FC<DroppableProps>;
  export const Draggable: FC<DraggableProps>;
}

declare module '@/components/ui/button' {
  import { FC, ReactNode } from 'react';
  
  export interface ButtonProps {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    children?: ReactNode;
    asChild?: boolean;
  }
  
  export const Button: FC<ButtonProps>;
}

declare module '@/components/ui/badge' {
  import { FC, ReactNode } from 'react';
  
  export interface BadgeProps {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
    children?: ReactNode;
  }
  
  export const Badge: FC<BadgeProps>;
}

declare module '@/components/ui/card' {
  import { FC, ReactNode, forwardRef, ForwardRefExoticComponent, RefAttributes } from 'react';
  
  export interface CardProps {
    className?: string;
    children?: ReactNode;
    ref?: React.Ref<HTMLDivElement>;
  }
  
  export interface CardHeaderProps {
    className?: string;
    children?: ReactNode;
  }
  
  export interface CardTitleProps {
    className?: string;
    children?: ReactNode;
  }
  
  export interface CardDescriptionProps {
    className?: string;
    children?: ReactNode;
  }
  
  export interface CardContentProps {
    className?: string;
    children?: ReactNode;
  }
  
  export interface CardFooterProps {
    className?: string;
    children?: ReactNode;
  }
  
  export const Card: ForwardRefExoticComponent<CardProps & RefAttributes<HTMLDivElement>>;
  export const CardHeader: FC<CardHeaderProps>;
  export const CardTitle: FC<CardTitleProps>;
  export const CardDescription: FC<CardDescriptionProps>;
  export const CardContent: FC<CardContentProps>;
  export const CardFooter: FC<CardFooterProps>;
}

declare module '@/components/ui/dropdown-menu' {
  import { FC, ReactNode } from 'react';
  
  export interface DropdownMenuProps {
    children?: ReactNode;
  }
  
  export interface DropdownMenuTriggerProps {
    asChild?: boolean;
    children?: ReactNode;
  }
  
  export interface DropdownMenuContentProps {
    align?: 'start' | 'center' | 'end';
    children?: ReactNode;
  }
  
  export interface DropdownMenuItemProps {
    onClick?: () => void;
    children?: ReactNode;
  }
  
  export const DropdownMenu: FC<DropdownMenuProps>;
  export const DropdownMenuTrigger: FC<DropdownMenuTriggerProps>;
  export const DropdownMenuContent: FC<DropdownMenuContentProps>;
  export const DropdownMenuItem: FC<DropdownMenuItemProps>;
}

declare module '@/components/ui/dialog' {
  import { FC, ReactNode } from 'react';
  
  export interface DialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: ReactNode;
  }
  
  export interface DialogTriggerProps {
    asChild?: boolean;
    children?: ReactNode;
  }
  
  export interface DialogContentProps {
    className?: string;
    children?: ReactNode;
  }
  
  export interface DialogHeaderProps {
    className?: string;
    children?: ReactNode;
  }
  
  export interface DialogFooterProps {
    className?: string;
    children?: ReactNode;
  }
  
  export interface DialogTitleProps {
    className?: string;
    children?: ReactNode;
  }
  
  export interface DialogDescriptionProps {
    className?: string;
    children?: ReactNode;
  }
  
  export const Dialog: FC<DialogProps>;
  export const DialogTrigger: FC<DialogTriggerProps>;
  export const DialogContent: FC<DialogContentProps>;
  export const DialogHeader: FC<DialogHeaderProps>;
  export const DialogFooter: FC<DialogFooterProps>;
  export const DialogTitle: FC<DialogTitleProps>;
  export const DialogDescription: FC<DialogDescriptionProps>;
}

declare module '@/components/ui/input' {
  import { FC, ReactNode } from 'react';
  
  export interface InputProps {
    id?: string;
    value?: string;
    onChange?: (e: any) => void;
    placeholder?: string;
    className?: string;
    maxLength?: number;
    type?: string;
  }
  
  export const Input: FC<InputProps>;
}

declare module '@/components/ui/textarea' {
  import { FC, ReactNode } from 'react';
  
  export interface TextareaProps {
    id?: string;
    value?: string;
    onChange?: (e: any) => void;
    placeholder?: string;
    className?: string;
    rows?: number;
    maxLength?: number;
  }
  
  export const Textarea: FC<TextareaProps>;
}

declare module '@/components/ui/label' {
  import { FC, ReactNode } from 'react';
  
  export interface LabelProps {
    htmlFor?: string;
    className?: string;
    children?: ReactNode;
  }
  
  export const Label: FC<LabelProps>;
}

declare module '@/components/ui/tabs' {
  import { FC, ReactNode } from 'react';
  
  export interface TabsProps {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    className?: string;
    children?: ReactNode;
  }
  
  export interface TabsListProps {
    className?: string;
    children?: ReactNode;
  }
  
  export interface TabsTriggerProps {
    value: string;
    className?: string;
    children?: ReactNode;
  }
  
  export interface TabsContentProps {
    value: string;
    className?: string;
    children?: ReactNode;
  }
  
  export const Tabs: FC<TabsProps>;
  export const TabsList: FC<TabsListProps>;
  export const TabsTrigger: FC<TabsTriggerProps>;
  export const TabsContent: FC<TabsContentProps>;
}

declare module '@/components/ui/toaster' {
  import { FC } from 'react';
  
  export const Toaster: FC;
}

declare module '@/components/ticket-search' {
  import { FC } from 'react';
  
  export interface TicketSearchProps {
    projectId: string;
  }
  
  export const TicketSearch: FC<TicketSearchProps>;
}

declare module 'react' {
  interface ReactElement {
    type: any;
    props: any;
    key: string | null;
  }
  
  type ReactText = string | number;
  type ReactChild = ReactElement | ReactText;
  
  interface ReactNodeArray extends Array<ReactNode> {}
  type ReactFragment = {} | ReactNodeArray;
  type ReactNode = ReactChild | ReactFragment | boolean | null | undefined;
  
  namespace JSX {
    interface Element extends ReactElement {}
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  interface Element extends React.ReactElement {}
}
