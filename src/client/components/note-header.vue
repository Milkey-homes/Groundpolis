<template>
<header class="kkwtjztg">
	<MkA class="name-set" :to="userPage(note.user)" v-user-preview="note.user.id">
		<template v-if="$store.reactiveState.noteNameDisplayMode.value === 0">
			<MkUserName class="name" :user="note.user"/>
			<span class="username"><MkAcct :user="note.user"/></span>
		</template>
		<template v-else>
			<span v-if="$store.reactiveState.noteNameDisplayMode.value !== 2" class="username"><MkAcct :user="note.user"/></span>
			<MkUserName class="name" v-if="$store.reactiveState.noteNameDisplayMode.value !== 3" :user="note.user"/>
		</template>
	</MkA>
	<span class="is-bot" v-if="note.user.isBot"><Fa :icon="faRobot"/></span>
	<span class="is-cat" v-if="note.user.isCat"><Fa :icon="faPaw"/></span>
	<GpVerified class="verified" v-if="note.user.isVerified" />
	<span class="premium" v-if="note.user.isPremium"><Fa :icon="faCrown"/></span>
	<div class="info">
		<span class="mobile" v-if="note.viaMobile"><Fa :icon="faMobileAlt"/></span>
		<MkA class="created-at" :to="notePage(note)">
			<MkTime v-if="enableAbsoluteTime" :time="note.createdAt" mode="absolute"/>
			<MkTime v-else-if="!enableAbsoluteTime" :time="note.createdAt" mode="relative"/>
		</MkA>
		<VisibilityIcon class="visibility" v-if="note.visibility !== 'public' || note.localOnly || note.remoteFollowersOnly"
			:visibility="note.visibility"
			:localOnly="note.localOnly"
			:remoteFollowersOnly="note.remoteFollowersOnly"
			/>
	</div>
</header>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faHome, faUnlock, faEnvelope, faMobileAlt, faBookmark, faUsers, faHeart, faHeartbeat, faCrown, faRobot, faPaw } from '@fortawesome/free-solid-svg-icons';
import { faBookmark as farBookmark } from '@fortawesome/free-regular-svg-icons';
import notePage from '../filters/note';
import { userPage } from '../filters/user';
import GpVerified from './verified.vue';
import VisibilityIcon from './visibility-icon.vue';
import { defaultStore } from '@/store';

export default defineComponent({
	components: {
		GpVerified,
		VisibilityIcon,
	},
	props: {
		note: {
			type: Object,
			required: true
		},
		detail: {
			type: Boolean,
			default: false,
		}
	},

	data() {
		return {
			faHome, faUnlock, faEnvelope, faMobileAlt, faBookmark, farBookmark, faUsers, faHeart, faHeartbeat, faCrown, faRobot, faPaw
		};
	},

	methods: {
		notePage,
		userPage
	},

	computed: {
		enableAbsoluteTime() {
			return this.$store.reactiveState.enableAbsoluteTime.value;
		},
	}
});
</script>

<style lang="scss" scoped>
.kkwtjztg {
	display: flex;
	align-items: baseline;
	white-space: nowrap;

	.name-set {
		overflow: hidden;
		font-size: 1em;
		font-weight: bold;
		text-decoration: none;
		text-overflow: ellipsis;
		> .name {
			margin: 0 .5em 0 0;
			padding: 0;
			overflow: hidden;
			color: var(--noteHeaderName);
			font-size: 1em;
			font-weight: bold;
			text-decoration: none;
			text-overflow: ellipsis;

			&:hover {
				text-decoration: underline;
			}
		}

		> .username {
			margin: 0 .5em 0 0;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}

	> .is-bot {
		margin-right: 0.5em;
	}

	> .is-cat {
		margin-right: 0.5em;
	}

	> .premium {
		margin-right: 0.5em;
		color: var(--premium);
	}

	> .verified {
		margin-right: 0.5em;
	}

	> .info {
		margin-left: auto;
		font-size: 0.9em;

		> .mobile {
			margin-right: 8px;
		}

		> .visibility {
			margin-left: 8px;
		}

		> .localOnly {
			margin-left: 8px;
		}

		> .remoteFollowersOnly {
			margin-left: 8px;
		}

		> .global {
			margin-left: 8px;
			color: var(--accent);
		}
	}
}
</style>
