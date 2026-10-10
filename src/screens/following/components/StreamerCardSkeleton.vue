<template>
	<div class="streamer-card" aria-hidden="true">
		<div class="card-header">
			<div class="header-left">
				<SkeletonBlock width="60px" height="60px" radius="50%" />

				<div class="header-info">
					<SkeletonBlock height="16px" width="120px" />
					<SkeletonBlock height="12px" width="80px" />
					<SkeletonBlock height="15px" width="55px" radius="6px" />
				</div>
			</div>

			<SkeletonBlock width="32px" height="32px" radius="8px" />
		</div>

		<div class="description-block">
			<SkeletonBlock height="13px" width="95%" />
			<SkeletonBlock height="13px" width="65%" />
		</div>

		<div class="card-footer">
			<SkeletonBlock height="11px" width="90px" />
			<SkeletonBlock height="12px" width="70px" />
		</div>
	</div>
</template>

<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
</script>

<style scoped>
.streamer-card {
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 5px;
	border-bottom: 1px solid var(--color-border);
}

.card-header {
	display: flex;
	justify-content: space-between;
	gap: 12px;
}

.header-left {
	display: flex;
	gap: 12px;
}

.header-info {
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 6px;
}

.description-block {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.card-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
}
</style>
