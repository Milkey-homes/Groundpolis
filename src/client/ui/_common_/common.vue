<template>
<component v-for="popup in popups"
	:key="popup.id"
	:is="popup.component"
	v-bind="popup.props"
	v-on="popup.events"
/>

<XUpload v-if="uploads.length > 0"/>

<XStreamIndicator/>

<div id="wait" v-if="pendingApiRequestsCount > 0"></div>

<div v-if="dev" id="devTicker"><span>DEV BUILD</span></div>
<div v-if="$i && $i.isBot && enableBotLoggedinWarning" id="botWarn"><span>{{ $ts.loggedInAsBot }}</span></div>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import { stream, popup, popups, uploads, pendingApiRequestsCount } from '@/os';
import * as sound from '@/scripts/sound';
import { $i } from '@/account';
import { defaultStore } from '@/store';

export default defineComponent({
	components: {
		XStreamIndicator: defineAsyncComponent(() => import('./stream-indicator.vue')),
		XUpload: defineAsyncComponent(() => import('./upload.vue')),
	},

	setup() {
		const onNotification = notification => {
			if ($i.mutingNotificationTypes.includes(notification.type)) return;

			if (document.visibilityState === 'visible') {
				stream.send('readNotification', {
					id: notification.id
				});

				popup(import('@/components/toast.vue'), {
					notification
				}, {}, 'closed');
			}

			sound.play('notification');
		};

		if ($i) {
			const connection = stream.useSharedConnection('main', 'UI');
			connection.on('notification', onNotification);
		}

		return {
			uploads,
			popups,
			pendingApiRequestsCount,
			dev: _DEV_,
			enableBotLoggedinWarning: defaultStore.state.enableBotLoggedinWarning,
		};
	},
});
</script>

<style lang="scss">
@keyframes dev-ticker-blink {
	0% { opacity: 1; }
	50% { opacity: 0; }
	100% { opacity: 1; }
}
@keyframes progress-spinner {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}

#wait {
	display: block;
	position: fixed;
	z-index: 10000;
	top: 15px;
	right: 15px;

	&:before {
		content: "";
		display: block;
		width: 18px;
		height: 18px;
		box-sizing: border-box;
		border: solid 2px transparent;
		border-top-color: var(--accent);
		border-left-color: var(--accent);
		border-radius: 50%;
		animation: progress-spinner 400ms linear infinite;
	}
}

#devTicker {
	position: fixed;
	top: 0;
	left: 0;
	z-index: 2147483647;
	color: #ff0;
	background: rgba(0, 0, 0, 0.5);
	padding: 4px 5px;
	font-size: 14px;
	pointer-events: none;
	user-select: none;
	> span {
		animation: dev-ticker-blink 2s infinite;
	}
}

#botWarn {
	position: fixed;
	top: 0;
	right: 0;
	z-index: 2147483647;
	color: #ffa500;
	background: rgba(0, 0, 0, 0.2);
	padding: 4px 7px;
	font-size: 14px;
	pointer-events: none;
	user-select: none;
	> span {
		animation: dev-ticker-blink 2s infinite;
	}
}

</style>
