<template>
	<div class="card" :class="{ shimmer: highlight }">
		<div class="header">
			<span v-if="item.icon">{{ item.icon }}</span>
			<h3 v-html="item.title"></h3>
		</div>

		<p v-if="item.description" class="description" v-html="item.description"></p>

		<ul v-if="item.bullets" class="bullets">
			<li v-for="bullet in item.bullets" :key="bullet" v-html="bullet"></li>
		</ul>

		<div v-if="item.preview" class="preview">
			<component :is="item.preview" />
		</div>

		<a
			v-if="item.link"
			:href="item.link.url"
			target="_blank"
			rel="noopener noreferrer"
			class="link"
		>
			{{ item.link.label }} →
		</a>
	</div>
</template>

<script setup lang="ts">
import type { ChangelogItem } from '@/screens/changelog/changelog.data';

interface Props {
	item: ChangelogItem;
	highlight?: boolean;
}

defineProps<Props>();
</script>

<style scoped>
.card {
	display: flex;
	flex-direction: column;
	gap: 12px;

	padding: 14px;

	background: var(--color-bg-secondary);

	border: 1px solid var(--color-border);
	border-radius: 10px;
}

.header {
	display: flex;
	align-items: center;
	gap: 10px;
}

.header span {
	font-size: 18px;
}

.header h3 {
	margin: 0;

	font-size: 15px;
	font-weight: 600;
	color: var(--color-text);
}

.description {
	margin: 0;

	font-size: 13px;
	line-height: 1.45;

	color: var(--color-text-dim);
}

.preview {
	width: fit-content;
	border-radius: 8px;
	overflow: hidden;

	background: var(--color-bg);
	border: 1px solid var(--color-border);

	padding: 10px;
}

.bullets {
	margin: 0;
	padding-left: 18px;

	color: var(--color-text-dim);
	font-size: 13px;
	line-height: 1.6;
}

.bullets li + li {
	margin-top: 4px;
}

.bullets li::marker {
	color: var(--color-link);
}

.description :deep(svg),
.bullets :deep(svg) {
	width: 1em;
	height: 1em;
	vertical-align: -0.15em;
	fill: currentColor;
}

.link {
	width: fit-content;

	font-size: 13px;
	font-weight: 600;
	color: var(--color-link);
	text-decoration: none;
}

.link:hover {
	text-decoration: underline;
}

.shimmer {
	position: relative;
	overflow: hidden;
	border-color: var(--color-accent);
}

.shimmer::after {
	content: '';
	position: absolute;
	inset: 0;
	pointer-events: none;
	background: linear-gradient(
		110deg,
		transparent 30%,
		rgba(145, 70, 255, 0.25) 50%,
		transparent 70%
	);
	transform: translateX(-100%);
	animation: shimmer-sweep 1.4s ease-in-out 2;
	animation-delay: calc(var(--i, 0) * 120ms + 300ms);
}

@keyframes shimmer-sweep {
	to {
		transform: translateX(100%);
	}
}

@media (prefers-reduced-motion: reduce) {
	.shimmer::after {
		animation: none;
	}
}
</style>
