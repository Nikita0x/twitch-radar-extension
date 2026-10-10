<template>
	<div class="tabs">
		<button
			v-for="tab in props.tabs"
			:key="tab.value"
			class="tab"
			:class="{ active: model === tab.value }"
			@click="model = tab.value"
		>
			{{ tab.label }}
			<span v-if="tab.count !== undefined" class="tab-count">{{ tab.count }}</span>
		</button>
	</div>
</template>

<script setup lang="ts" generic="T extends string">
interface Props {
	tabs: { value: T; label: string; count?: number }[];
}

const props = defineProps<Props>();
const model = defineModel<T>({ required: true });
</script>

<style scoped>
/*
 * Colors are CSS variables so a parent can restyle the tabs for its context
 * (e.g. the header) without a second copy of this component. The fallbacks
 * are the default look used on regular content backgrounds.
 */
.tabs {
	display: flex;
	gap: 6px;

	padding: 3px;

	background: var(--tabs-bg, var(--color-bg-secondary));
	border-radius: 8px;
}

.tab {
	flex: 1;

	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;

	padding: 6px 12px;

	border: none;
	border-radius: var(--tab-radius, 6px);
	background: transparent;

	color: var(--tab-color, var(--color-text-dim));
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;

	transition:
		background 0.15s ease,
		color 0.15s ease,
		box-shadow 0.15s ease;
}

.tab:hover {
	color: var(--tab-hover-color, var(--color-text));
	box-shadow: inset 0 -2px 0 var(--tab-hover-indicator, transparent);
}

.tab.active {
	background: var(--tab-active-bg, var(--color-bg));
	color: var(--tab-active-color, var(--color-accent));
	/* inset shadow instead of border-bottom: draws an underline without changing the tab's height */
	box-shadow: inset 0 -2px 0 var(--tab-indicator, transparent);
}

.tab-count {
	font-size: 11px;
	opacity: var(--tab-count-opacity, 0.7);
}
</style>
