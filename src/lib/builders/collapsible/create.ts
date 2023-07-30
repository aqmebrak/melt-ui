import {
	addMeltEventListener,
	builder,
	createElHelpers,
	omit,
	overridable,
	toWritableStores,
} from '$lib/internal/helpers';
import { derived, writable } from 'svelte/store';
import type { CreateCollapsibleProps } from './types';
import { styleToString } from '../../internal/helpers/style';
import type { MeltActionReturn } from '@melt-ui/svelte/internal/types';

const defaults = {
	defaultOpen: false,
	disabled: false,
	forceVisible: false,
} satisfies CreateCollapsibleProps;

const { name } = createElHelpers('collapsible');

export function createCollapsible(props?: CreateCollapsibleProps) {
	const withDefaults = { ...defaults, ...props } satisfies CreateCollapsibleProps;

	const options = toWritableStores(omit(withDefaults, 'open'));
	const { disabled, forceVisible } = options;

	const openWritable = withDefaults.open ?? writable(withDefaults.defaultOpen);
	const open = overridable(openWritable, withDefaults?.onOpenChange);

	const root = builder(name(), {
		stores: [open, disabled],
		returned: ([$open, $disabled]) => ({
			'data-state': $open ? 'open' : 'closed',
			'data-disabled': $disabled ? '' : 'undefined',
		}),
	});

	type TriggerEvents = 'click';
	const trigger = builder(name('trigger'), {
		stores: [open, disabled],
		returned: ([$open, $disabled]) =>
			({
				'data-state': $open ? 'open' : 'closed',
				'data-disabled': $disabled ? '' : undefined,
				disabled: $disabled,
			} as const),
		action: (node: HTMLElement): MeltActionReturn<TriggerEvents> => {
			const unsub = addMeltEventListener(node, 'click', () => {
				const disabled = node.dataset.disabled !== undefined;
				if (disabled) return;
				open.update(($open) => !$open);
			});

			return {
				destroy: unsub,
			};
		},
	});

	const isVisible = derived(
		[open, forceVisible],
		([$open, $forceVisible]) => $open || $forceVisible
	);

	const content = builder(name('content'), {
		stores: [isVisible, disabled],
		returned: ([$isVisible, $disabled]) => ({
			'data-state': $isVisible ? 'open' : 'closed',
			'data-disabled': $disabled ? '' : undefined,
			hidden: $isVisible ? undefined : true,
			style: styleToString({
				display: $isVisible ? undefined : 'none',
			}),
		}),
	});

	return {
		elements: {
			root,
			trigger,
			content,
		},
		states: {
			open,
		},
		options,
	};
}
