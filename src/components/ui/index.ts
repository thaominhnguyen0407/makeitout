/**
 * UI primitives — correct-by-default, built on Base UI (@base-ui/react) and
 * styled entirely with the app's semantic theme tokens. These are yours:
 * restyle or delete them freely. Build app-specific components alongside them.
 *
 * The look comes from the token values in `styles.css` / `themes.css`
 * (colors, `--radius`, shadows) — change those to change the app, without
 * touching these files.
 *
 * @example
 * import { Button, Input, useToast } from '../components/ui'
 */

/* Utility */
export { cn } from '@/lib/utils'

/* Form */
export { Button, buttonVariants, type ButtonProps } from './Button'
export { Input } from './Input'
export { Label } from './Label'

/* Data display */
export { Avatar, AvatarImage, AvatarFallback } from './Avatar'

/* Feedback */
export { ToastProvider, useToast } from './Toast'

/* Overlay */
export {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup,
  DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuRadioGroup,
} from './DropdownMenu'
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './Tooltip'
