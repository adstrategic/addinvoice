/**
 * Design-system barrel (imports-design-system-folder).
 *
 * App code imports UI primitives from '@/components/ui' — never from
 * 'react-native' or 'expo-image' directly — so restyling or swapping an
 * implementation stays a one-file change.
 */
export { Badge, type BadgeProps } from './badge'
export { Button, type ButtonProps } from './button'
export { Card, type CardProps } from './card'
export { Divider, type DividerProps } from './divider'
export { FieldLabel, type FieldLabelProps } from './field'
export * from './icons'
export { Image, type ImageProps } from './image'
export { Input, type InputProps } from './input'
export { NumericInput, type NumericInputProps } from './numeric-input'
export { ProgressBar, type ProgressBarProps } from './progress'
export { Screen, ScreenView, type ScreenProps } from './screen'
export { Select, type SelectOption, type SelectProps } from './select'
export { Sheet, type SheetProps } from './sheet'
export { Skeleton } from './skeleton'
export { Spinner, type SpinnerProps } from './spinner'
export { Text, type TextProps } from './text'
export { View, type ViewProps } from './view'
