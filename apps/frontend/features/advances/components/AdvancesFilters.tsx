"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"
import { motion } from "framer-motion"

interface AdvanceFiltersProps {
	searchTerm: string
	onSearchChange: (value: string) => void
	statusFilter: string
	onStatusChange: (value: string) => void
}

/**
 * Advance filters component
 * Includes search and status filter dropdown
 */
export function AdvanceFilters({
	searchTerm,
	onSearchChange,
	statusFilter,
	onStatusChange,
}: AdvanceFiltersProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.2 }}
		>
			<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search advances..."
						className="pl-10"
						value={searchTerm}
						onChange={(event) => onSearchChange(event.target.value)}
					/>
				</div>
				<Select value={statusFilter} onValueChange={onStatusChange}>
					<SelectTrigger className="w-full sm:w-[180px]">
						<SelectValue placeholder="Filter by status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All statuses</SelectItem>
						<SelectItem value="draft">Draft</SelectItem>
						<SelectItem value="issued">Issued</SelectItem>
						<SelectItem value="invoiced">Invoiced</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</motion.div>
	)
}
