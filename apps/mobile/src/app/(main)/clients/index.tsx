import type { ClientResponse } from '@addinvoice/schemas'
import { FlashList } from '@shopify/flash-list'
import { router, Stack } from 'expo-router'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Linking, RefreshControl, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { toast } from 'sonner-native'

import { EmptyState } from '@/components/shared/empty-state'
import { EntityDeleteModal } from '@/components/shared/entity-delete-modal'
import { Fab } from '@/components/shared/fab'
import {
	PopoverMenu,
	type PopoverAnchor,
	type PopoverMenuItem,
} from '@/components/shared/popover-menu'
import { Button, Card, Skeleton, Spinner, Text } from '@/components/ui'
import {
	BuildingIcon,
	EyeIcon,
	MailIcon,
	MicIcon,
	PencilIcon,
	PlusIcon,
	TrashIcon,
} from '@/components/ui/icons'
import { ClientCard } from '@/features/clients/components/client-card'
import { ClientStats } from '@/features/clients/components/client-stats'
import { useClientDelete } from '@/features/clients/hooks/use-client-delete'
import { useClientsInfinite } from '@/features/clients/hooks/use-clients'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

// list-performance-inline-objects: hoisted so renderItem allocates nothing.
const LIST_CONTENT_STYLE = { paddingHorizontal: 24, paddingTop: 8 }
const SEPARATOR_STYLE = { height: 12 }

export default function ClientsScreen() {
	const insets = useSafeAreaInsets()
	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput)

	const {
		data,
		isLoading,
		isError,
		refetch,
		isRefetching,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useClientsInfinite(search)

	// list-performance-function-references: flattened ONCE and memoised. Mapping
	// or filtering inline would hand FlashList a new array (and new item object
	// identities) on every render, defeating recycling.
	const clients = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data])
	const stats = data?.pages[0]?.stats

	// Row actions need to look a client up by sequence, but closing over the
	// array directly would rebuild every handler each time a page is appended —
	// re-rendering all visible rows mid-scroll. The ref keeps the lookup current
	// while the callbacks stay referentially stable for the life of the screen.
	const clientsRef = useRef(clients)
	clientsRef.current = clients

	const clientDelete = useClientDelete()
	const { openDeleteModal } = clientDelete

	// One menu for the whole list, anchored to whichever row was tapped — rather
	// than every row mounting its own (list-performance-item-expensive).
	const [menu, setMenu] = useState<{ sequence: number; anchor: PopoverAnchor } | null>(null)

	// list-performance-callbacks: one handler set at the list root; rows call
	// them with their own sequence.
	const handlePress = useCallback((sequence: number) => {
		router.push(`/(main)/clients/${sequence}`)
	}, [])

	const handleOpenMenu = useCallback((sequence: number, anchor: PopoverAnchor) => {
		setMenu({ sequence, anchor })
	}, [])

	const handleCloseMenu = useCallback(() => setMenu(null), [])

	const handleEdit = useCallback((sequence: number) => {
		router.push(`/(main)/clients/${sequence}/edit`)
	}, [])

	const handleSendEmail = useCallback((sequence: number) => {
		const client = clientsRef.current.find((item) => item.sequence === sequence)
		if (!client?.email) return
		void Linking.openURL(`mailto:${client.email}`)
	}, [])

	const handleDelete = useCallback(
		(sequence: number) => {
			const client = clientsRef.current.find((item) => item.sequence === sequence)
			if (!client) return
			openDeleteModal({
				id: client.id,
				sequence: client.sequence,
				description: client.businessName || client.name,
			})
		},
		[openDeleteModal],
	)

	const menuClient = menu ? clients.find((item) => item.sequence === menu.sequence) : undefined

	const menuItems = useMemo<PopoverMenuItem[]>(() => {
		if (!menu) return []

		const items: PopoverMenuItem[] = [
			{
				key: 'view',
				label: 'View Details',
				icon: <EyeIcon size={16} color="#020b0f" />,
				onSelect: () => handlePress(menu.sequence),
			},
			{
				key: 'edit',
				label: 'Edit',
				icon: <PencilIcon size={16} color="#020b0f" />,
				onSelect: () => handleEdit(menu.sequence),
			},
		]

		// The web hides this row entirely when the client has no email.
		if (menuClient?.email) {
			items.push({
				key: 'email',
				label: 'Send Email',
				icon: <MailIcon size={16} color="#020b0f" />,
				onSelect: () => handleSendEmail(menu.sequence),
			})
		}

		items.push({
			key: 'delete',
			label: 'Delete',
			icon: <TrashIcon size={16} color="#d40924" />,
			destructive: true,
			onSelect: () => handleDelete(menu.sequence),
		})

		return items
	}, [menu, menuClient, handlePress, handleEdit, handleSendEmail, handleDelete])

	const handleEndReached = useCallback(() => {
		if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
	}, [hasNextPage, isFetchingNextPage, fetchNextPage])

	const renderItem = useCallback(
		({ item }: { item: ClientResponse }) => (
			<ClientCard
				sequence={item.sequence}
				name={item.name}
				businessName={item.businessName ?? null}
				email={item.email}
				phone={item.phone ?? null}
				logo={item.logo ?? null}
				onPress={handlePress}
				onOpenMenu={handleOpenMenu}
			/>
		),
		[handlePress, handleOpenMenu],
	)

	const listHeader = (
		<View className="gap-6 pb-4">
			<View className="items-center gap-1">
				<Text variant="heading">Clients</Text>
				<Text variant="muted">Manage your client relationships</Text>
			</View>

			<View className="flex-row gap-2">
				<Button
					label="Add by voice"
					variant="outline"
					className="flex-1"
					// Voice capture ships in its own phase; the button is here so the
					// layout matches the web now rather than shifting later.
					onPress={notifyVoiceComingSoon}
				/>
				<Button
					label="Add new client"
					className="flex-1"
					onPress={() => router.push('/(main)/clients/create')}
				/>
			</View>

			{stats ? (
				<ClientStats
					total={stats.total}
					active={stats.active}
					newThisMonth={stats.newThisMonth}
				/>
			) : null}
		</View>
	)

	return (
		<View className="flex-1 bg-background">
			<Stack.Screen
				options={{
					title: 'Clients',
					// navigation-native-navigators: the web's in-page search input maps
					// onto the platform search bar, which collapses with the large title.
					headerSearchBarOptions: {
						placeholder: 'Search clients...',
						onChangeText: (event) => setSearchInput(event.nativeEvent.text),
						hideWhenScrolling: false,
					},
				}}
			/>

			{isError ? (
				<View className="p-6">
					<Card>
						<Text variant="title">We couldn&apos;t load your clients</Text>
						<Text variant="muted">Check your connection and try again.</Text>
						<Button label="Retry" onPress={() => void refetch()} />
					</Card>
				</View>
			) : isLoading ? (
				<ClientListSkeleton />
			) : (
				<FlashList
					data={clients}
					renderItem={renderItem}
					keyExtractor={keyExtractor}
					ListHeaderComponent={listHeader}
					ItemSeparatorComponent={ItemSeparator}
					ListEmptyComponent={
						<EmptyState
							icon={<BuildingIcon size={40} color="#58666a" />}
							title="No clients found"
							description={
								search
									? 'No client matches that search.'
									: 'Add your first client to start invoicing.'
							}
						/>
					}
					ListFooterComponent={isFetchingNextPage ? <ListFooterSpinner /> : null}
					onEndReached={handleEndReached}
					onEndReachedThreshold={0.5}
					// The menu's anchor is a snapshot of where the row was when tapped,
					// so it would drift away from its button as soon as the list moves.
					// Dismissing on scroll is what web popovers do too.
					onScrollBeginDrag={handleCloseMenu}
					refreshControl={
						<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
					}
					// Unlike the `Screen` primitive, this list sits under a native
					// header with a large title and a search bar. `automatic` is what
					// lets iOS collapse both on scroll and inset the content behind
					// them; the top safe area is the header's job here, not ours. The
					// prop is a no-op on Android, where the opaque header already
					// occupies that space.
					contentInsetAdjustmentBehavior="automatic"
					contentContainerStyle={{
						...LIST_CONTENT_STYLE,
						// Clears the tab bar so the last row is never trapped behind it.
						paddingBottom: insets.bottom + 120,
					}}
					keyboardShouldPersistTaps="handled"
				/>
			)}

			<Fab
				actions={[
					{
						key: 'voice',
						variant: 'secondary',
						accessibilityLabel: 'Create client by voice',
						icon: <MicIcon size={20} color="#00a3ab" />,
						// Same placeholder behaviour as the header button — a dead
						// control gives no feedback, so it explains itself instead.
						onPress: notifyVoiceComingSoon,
					},
					{
						key: 'create',
						accessibilityLabel: 'Add new client',
						icon: <PlusIcon size={24} color="#ffffff" />,
						onPress: () => router.push('/(main)/clients/create'),
					},
				]}
			/>

			<PopoverMenu anchor={menu?.anchor ?? null} items={menuItems} onClose={handleCloseMenu} />

			<EntityDeleteModal
				isOpen={clientDelete.isDeleteModalOpen}
				onClose={clientDelete.closeDeleteModal}
				onConfirm={clientDelete.handleDeleteConfirm}
				entity="client"
				entityName={clientDelete.clientToDelete?.description ?? ''}
				isDeleting={clientDelete.isDeleting}
			/>
		</View>
	)
}

function keyExtractor(item: ClientResponse) {
	return String(item.id)
}

/** Placeholder until the voice-capture phase wires up POST /clients/from-voice-audio. */
function notifyVoiceComingSoon() {
	toast('Voice creation is coming soon', {
		description: 'For now, add clients with the form.',
	})
}

function ItemSeparator() {
	return <View style={SEPARATOR_STYLE} />
}

function ListFooterSpinner() {
	return (
		<View className="items-center py-6">
			<Spinner />
		</View>
	)
}

function ClientListSkeleton() {
	return (
		<View className="gap-3 p-6" accessibilityLabel="Loading clients">
			{[0, 1, 2, 3].map((row) => (
				<Skeleton key={row} className="h-24 w-full rounded-lg" />
			))}
		</View>
	)
}
