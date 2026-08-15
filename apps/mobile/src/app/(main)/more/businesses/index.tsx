import { router } from 'expo-router'
import { useCallback, useMemo } from 'react'
import { Pressable, View } from 'react-native'

import { Button, Screen, Sheet, Spinner, Text } from '@/components/ui'
import { CompanyCard } from '@/features/businesses/components/company-card'
import { useBusinessDelete } from '@/features/businesses/hooks/use-business-delete'
import {
	useBusinesses,
	useSetDefaultBusiness,
} from '@/features/businesses/hooks/use-businesses'

export default function CompaniesScreen() {
	// The backend caps `limit` at 30 and a workspace has a handful of businesses,
	// so this list is bounded and does not need virtualisation. Clients is where
	// FlashList earns its native dependency.
	const { data, isLoading } = useBusinesses()
	const setDefaultBusiness = useSetDefaultBusiness()
	const {
		isDeleteModalOpen,
		businessToDelete,
		openDeleteModal,
		closeDeleteModal,
		handleDeleteConfirm,
		isDeleting,
	} = useBusinessDelete()

	// Memoised so the row callbacks below keep stable identities across renders.
	const businesses = useMemo(() => data?.data ?? [], [data])
	// Removing the last business flips useHasBusiness to false, which the funnel
	// resolver reads — the user would be thrown back into setup from here.
	const canDelete = businesses.length > 1

	const handlePress = useCallback((id: number) => {
		router.push(`/(main)/more/businesses/${id}/edit`)
	}, [])

	const handleSetDefault = useCallback(
		(id: number) => {
			setDefaultBusiness.mutate(id)
		},
		[setDefaultBusiness],
	)

	const handleDelete = useCallback(
		(id: number) => {
			const business = businesses.find((item) => item.id === id)
			if (!business) return
			openDeleteModal({ id: business.id, name: business.name })
		},
		[businesses, openDeleteModal],
	)

	return (
		<Screen contentClassName="gap-6">
			<View className="flex-row items-start justify-between gap-4">
				<View className="min-w-0 flex-1 gap-1">
					<Text variant="title">Your Companies</Text>
					<Text className="font-sans text-sm text-muted-foreground">
						Manage multiple companies and their settings
					</Text>
				</View>
				<Button label="Add" onPress={() => router.push('/(main)/more/businesses/create')} />
			</View>

			{isLoading ? (
				<Spinner />
			) : businesses.length === 0 ? (
				<Text variant="muted" className="py-8 text-center">
					No businesses yet. Create your first business!
				</Text>
			) : (
				businesses.map((business) => (
					<CompanyCard
						key={business.id}
						id={business.id}
						name={business.name}
						email={business.email}
						address={business.address}
						logo={business.logo ?? null}
						isDefault={business.isDefault}
						canDelete={canDelete}
						isBusy={setDefaultBusiness.isPending}
						onPress={handlePress}
						onSetDefault={handleSetDefault}
						onDelete={handleDelete}
					/>
				))
			)}

			<Sheet isVisible={isDeleteModalOpen} onClose={closeDeleteModal} title="Delete Company">
				<Text variant="muted">
					Are you sure you want to delete {businessToDelete?.name}? This action cannot be
					undone.
				</Text>

				<View className="gap-2">
					<Pressable
						accessibilityRole="button"
						disabled={isDeleting}
						onPress={handleDeleteConfirm}
						style={{ borderCurve: 'continuous' }}
						className={`min-h-12 items-center justify-center rounded-lg bg-destructive px-5 py-3 ${
							isDeleting ? 'opacity-50' : ''
						}`}
					>
						<Text className="font-sans-semibold text-base text-destructive-foreground">
							{isDeleting ? 'Deleting...' : 'Delete'}
						</Text>
					</Pressable>
					<Button
						label="Cancel"
						variant="outline"
						disabled={isDeleting}
						onPress={closeDeleteModal}
					/>
				</View>
			</Sheet>
		</Screen>
	)
}
