<template>
	<div class="toggle-container">
		<div class="toggle-info">
			<span class="toggle-label">{{ label }}</span>
			<span class="toggle-desc">{{ description }}</span>
		</div>
		<label class="switch">
			<input type="checkbox" :checked="checked" :disabled="disabled" @change="emit('change')" />
			<span class="slider"></span>
		</label>
	</div>
</template>

<script setup lang="ts">
interface Props {
	label: string;
	description: string;
	checked?: boolean;
	disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
	checked: false,
	disabled: false,
});

const emit = defineEmits<{ change: [] }>();
</script>

<style scoped>
.toggle-container {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
}

.toggle-info {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.toggle-label {
	font-size: 14px;
	font-weight: 600;
	color: var(--color-text);
}

.toggle-desc {
	font-size: 12px;
	color: var(--color-text-dim);
}

/* ── Toggle switch ── */
.switch {
	position: relative;
	display: inline-block;
	width: 44px;
	height: 24px;
	flex-shrink: 0;
}

.switch input {
	opacity: 0;
	width: 0;
	height: 0;

	&:disabled + .slider {
		opacity: 0.5;
		cursor: not-allowed;
		background-color: var(--color-border);
	}

	&:disabled:checked + .slider {
		background-color: var(--color-border);
	}
}

.slider {
	position: absolute;
	cursor: pointer;
	inset: 0;
	background-color: var(--color-border);
	transition: 0.3s;
	border-radius: 24px;
}

.slider::before {
	content: '';
	position: absolute;
	height: 18px;
	width: 18px;
	left: 3px;
	bottom: 3px;
	background-color: white;
	transition: 0.3s;
	border-radius: 50%;
}

input:checked + .slider {
	background-color: var(--color-accent);
}

input:checked + .slider::before {
	transform: translateX(20px);
}
</style>
