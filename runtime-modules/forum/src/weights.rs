// This file is part of Substrate.

// Copyright (C) 2022 Parity Technologies (UK) Ltd.
// SPDX-License-Identifier: Apache-2.0

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

//! Autogenerated weights for forum
//!
//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 4.0.0-dev
//! DATE: 2022-09-01, STEPS: `50`, REPEAT: 20, LOW RANGE: `[]`, HIGH RANGE: `[]`
//! EXECUTION: Some(Wasm), WASM-EXECUTION: Compiled, CHAIN: Some("dev"), DB CACHE: 1024

// Executed Command:
// ./scripts/../target/release/joystream-node
// benchmark
// pallet
// --pallet=forum
// --extrinsic=*
// --chain=dev
// --steps=50
// --repeat=20
// --execution=wasm
// --template=./scripts/../devops/joystream-pallet-weight-template.hbs
// --output=.

#![cfg_attr(rustfmt, rustfmt_skip)]
#![allow(unused_parens)]
#![allow(unused_imports)]
#![allow(unused_variables)]

use frame_support::{traits::Get, weights::Weight};
use sp_std::marker::PhantomData;

/// Weight functions needed for forum.
pub trait WeightInfo {
	fn create_category(_i: u32, _j: u32, _k: u32, ) -> Weight;
	fn update_category_membership_of_moderator_new() -> Weight;
	fn update_category_membership_of_moderator_old() -> Weight;
	fn update_category_archival_status_lead(_i: u32, ) -> Weight;
	fn update_category_archival_status_moderator(_i: u32, ) -> Weight;
	fn update_category_title_lead(_i: u32, _j: u32, ) -> Weight;
	fn update_category_title_moderator(_i: u32, _j: u32, ) -> Weight;
	fn update_category_description_lead(_i: u32, _j: u32, ) -> Weight;
	fn update_category_description_moderator(_i: u32, _j: u32, ) -> Weight;
	fn delete_category_lead(_i: u32, ) -> Weight;
	fn delete_category_moderator(_i: u32, ) -> Weight;
	fn create_thread(_i: u32, _j: u32, _k: u32, ) -> Weight;
	fn edit_thread_metadata(_i: u32, _j: u32, ) -> Weight;
	fn delete_thread(_i: u32, ) -> Weight;
	fn move_thread_to_category_lead(_i: u32, ) -> Weight;
	fn move_thread_to_category_moderator(_i: u32, ) -> Weight;
	fn moderate_thread_lead(_i: u32, _k: u32, ) -> Weight;
	fn moderate_thread_moderator(_i: u32, _k: u32, ) -> Weight;
	fn add_post(_i: u32, _j: u32, ) -> Weight;
	fn react_post(_i: u32, ) -> Weight;
	fn edit_post_text(_i: u32, _j: u32, ) -> Weight;
	fn moderate_post_lead(_i: u32, _j: u32, ) -> Weight;
	fn moderate_post_moderator(_i: u32, _j: u32, ) -> Weight;
	fn delete_posts(_i: u32, _j: u32, _k: u32, ) -> Weight;
	fn set_stickied_threads_lead(_i: u32, _j: u32, ) -> Weight;
	fn set_stickied_threads_moderator(_i: u32, _j: u32, ) -> Weight;
}

/// Weights for forum using the Substrate node and recommended hardware.
pub struct SubstrateWeight<T>(PhantomData<T>);
impl<T: frame_system::Config> WeightInfo for SubstrateWeight<T> {
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2b3091994c5737d8f16ba1c53919a94bf2] (r:1 w:0)
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2bb88c49b6e6ccae735eb57de6295caf6a] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4ae4b647661a67525b37dcb644a82d18afa] (r:1 w:1)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4ae6816f953a9f20b3ded79f458cf3db2d3] (r:1 w:1)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:1 w:1)
	fn create_category(i: u32, j: u32, k: u32, ) -> Weight {
		(23_746_000 as Weight)
			// Standard Error: 86_000
			.saturating_add((5_458_000 as Weight).saturating_mul(i as Weight))
			// Standard Error: 0
			.saturating_add((1_000 as Weight).saturating_mul(j as Weight))
			// Standard Error: 0
			.saturating_add((2_000 as Weight).saturating_mul(k as Weight))
			.saturating_add(T::DbWeight::get().reads(4 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(T::DbWeight::get().writes(3 as Weight))
	}
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2b3091994c5737d8f16ba1c53919a94bf2] (r:1 w:0)
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2bb88c49b6e6ccae735eb57de6295caf6a] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:1 w:1)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aed53340396297732bff650c88807adafc] (r:0 w:1)
	fn update_category_membership_of_moderator_new() -> Weight {
		(32_536_000 as Weight)
			.saturating_add(T::DbWeight::get().reads(3 as Weight))
			.saturating_add(T::DbWeight::get().writes(2 as Weight))
	}
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2b3091994c5737d8f16ba1c53919a94bf2] (r:1 w:0)
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2bb88c49b6e6ccae735eb57de6295caf6a] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:1 w:1)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aed53340396297732bff650c88807adafc] (r:1 w:1)
	fn update_category_membership_of_moderator_old() -> Weight {
		(33_247_000 as Weight)
			.saturating_add(T::DbWeight::get().reads(4 as Weight))
			.saturating_add(T::DbWeight::get().writes(2 as Weight))
	}
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2b3091994c5737d8f16ba1c53919a94bf2] (r:1 w:0)
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2bb88c49b6e6ccae735eb57de6295caf6a] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:1 w:1)
	fn update_category_archival_status_lead(i: u32, ) -> Weight {
		(20_457_000 as Weight)
			// Standard Error: 73_000
			.saturating_add((4_220_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(T::DbWeight::get().reads(2 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(T::DbWeight::get().writes(1 as Weight))
	}
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2bb88c49b6e6ccae735eb57de6295caf6a] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:1 w:1)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aed53340396297732bff650c88807adafc] (r:1 w:0)
	fn update_category_archival_status_moderator(i: u32, ) -> Weight {
		(21_953_000 as Weight)
			// Standard Error: 93_000
			.saturating_add((4_279_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(T::DbWeight::get().reads(2 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(T::DbWeight::get().writes(1 as Weight))
	}
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2b3091994c5737d8f16ba1c53919a94bf2] (r:1 w:0)
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2bb88c49b6e6ccae735eb57de6295caf6a] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:1 w:1)
	fn update_category_title_lead(i: u32, j: u32, ) -> Weight {
		(19_646_000 as Weight)
			// Standard Error: 54_000
			.saturating_add((4_606_000 as Weight).saturating_mul(i as Weight))
			// Standard Error: 0
			.saturating_add((1_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(T::DbWeight::get().reads(2 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(T::DbWeight::get().writes(1 as Weight))
	}
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2bb88c49b6e6ccae735eb57de6295caf6a] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:1 w:1)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aed53340396297732bff650c88807adafc] (r:1 w:0)
	fn update_category_title_moderator(i: u32, j: u32, ) -> Weight {
		(23_561_000 as Weight)
			// Standard Error: 53_000
			.saturating_add((4_333_000 as Weight).saturating_mul(i as Weight))
			// Standard Error: 0
			.saturating_add((1_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(T::DbWeight::get().reads(2 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(T::DbWeight::get().writes(1 as Weight))
	}
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2b3091994c5737d8f16ba1c53919a94bf2] (r:1 w:0)
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2bb88c49b6e6ccae735eb57de6295caf6a] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:1 w:1)
	fn update_category_description_lead(i: u32, j: u32, ) -> Weight {
		(19_292_000 as Weight)
			// Standard Error: 44_000
			.saturating_add((4_722_000 as Weight).saturating_mul(i as Weight))
			// Standard Error: 0
			.saturating_add((1_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(T::DbWeight::get().reads(2 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(T::DbWeight::get().writes(1 as Weight))
	}
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2bb88c49b6e6ccae735eb57de6295caf6a] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:1 w:1)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aed53340396297732bff650c88807adafc] (r:1 w:0)
	fn update_category_description_moderator(i: u32, j: u32, ) -> Weight {
		(22_503_000 as Weight)
			// Standard Error: 40_000
			.saturating_add((4_526_000 as Weight).saturating_mul(i as Weight))
			// Standard Error: 0
			.saturating_add((1_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(T::DbWeight::get().reads(2 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(T::DbWeight::get().writes(1 as Weight))
	}
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2b3091994c5737d8f16ba1c53919a94bf2] (r:1 w:0)
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2bb88c49b6e6ccae735eb57de6295caf6a] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:1 w:1)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4ae4b647661a67525b37dcb644a82d18afa] (r:1 w:1)
	fn delete_category_lead(i: u32, ) -> Weight {
		(21_694_000 as Weight)
			// Standard Error: 84_000
			.saturating_add((4_805_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(T::DbWeight::get().reads(3 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(T::DbWeight::get().writes(2 as Weight))
	}
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2bb88c49b6e6ccae735eb57de6295caf6a] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:2 w:2)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aed53340396297732bff650c88807adafc] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4ae4b647661a67525b37dcb644a82d18afa] (r:1 w:1)
	fn delete_category_moderator(i: u32, ) -> Weight {
		(24_664_000 as Weight)
			// Standard Error: 70_000
			.saturating_add((4_834_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(T::DbWeight::get().reads(2 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(T::DbWeight::get().writes(3 as Weight))
	}
	// Storage: unknown [0x2ce461329fdf4be12bce01afc0af09bc13020dc69e85870ac7b4c755bb8753c2] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:1 w:1)
	// Storage: unknown [0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9] (r:2 w:2)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4ae07b6d1d0edd85eef4e4275f27d79175d] (r:1 w:1)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aedfeb47efcb121b0e718a654f15a6806f] (r:1 w:1)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4ae503ee3d19713303eb815933d040b41ee] (r:1 w:1)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aec50c142a64f2c4bb5f5a5506f78ade7e] (r:0 w:1)
	fn create_thread(i: u32, j: u32, k: u32, ) -> Weight {
		(77_362_000 as Weight)
			// Standard Error: 151_000
			.saturating_add((5_146_000 as Weight).saturating_mul(i as Weight))
			// Standard Error: 0
			.saturating_add((1_000 as Weight).saturating_mul(j as Weight))
			// Standard Error: 0
			.saturating_add((2_000 as Weight).saturating_mul(k as Weight))
			.saturating_add(T::DbWeight::get().reads(6 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(T::DbWeight::get().writes(7 as Weight))
	}
	// Storage: unknown [0x2ce461329fdf4be12bce01afc0af09bc13020dc69e85870ac7b4c755bb8753c2] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aedfeb47efcb121b0e718a654f15a6806f] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:1 w:0)
	fn edit_thread_metadata(i: u32, j: u32, ) -> Weight {
		(20_846_000 as Weight)
			// Standard Error: 175_000
			.saturating_add((4_636_000 as Weight).saturating_mul(i as Weight))
			// Standard Error: 0
			.saturating_add((1_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(T::DbWeight::get().reads(2 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
	}
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aedfeb47efcb121b0e718a654f15a6806f] (r:1 w:1)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:1 w:1)
	// Storage: unknown [0x2ce461329fdf4be12bce01afc0af09bc13020dc69e85870ac7b4c755bb8753c2] (r:1 w:0)
	// Storage: unknown [0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9] (r:2 w:2)
	fn delete_thread(i: u32, ) -> Weight {
		(51_770_000 as Weight)
			// Standard Error: 334_000
			.saturating_add((3_900_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(T::DbWeight::get().reads(4 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(T::DbWeight::get().writes(4 as Weight))
	}
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2b3091994c5737d8f16ba1c53919a94bf2] (r:1 w:0)
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2bb88c49b6e6ccae735eb57de6295caf6a] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:2 w:2)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aedfeb47efcb121b0e718a654f15a6806f] (r:1 w:2)
	fn move_thread_to_category_lead(i: u32, ) -> Weight {
		(34_528_000 as Weight)
			// Standard Error: 160_000
			.saturating_add((5_746_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(T::DbWeight::get().reads(4 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(T::DbWeight::get().writes(4 as Weight))
	}
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2bb88c49b6e6ccae735eb57de6295caf6a] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:2 w:2)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aed53340396297732bff650c88807adafc] (r:2 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aedfeb47efcb121b0e718a654f15a6806f] (r:1 w:2)
	fn move_thread_to_category_moderator(i: u32, ) -> Weight {
		(40_855_000 as Weight)
			// Standard Error: 170_000
			.saturating_add((5_688_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(T::DbWeight::get().reads(5 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(T::DbWeight::get().writes(4 as Weight))
	}
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2b3091994c5737d8f16ba1c53919a94bf2] (r:1 w:0)
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2bb88c49b6e6ccae735eb57de6295caf6a] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:1 w:1)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aedfeb47efcb121b0e718a654f15a6806f] (r:1 w:1)
	// Storage: unknown [0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9] (r:1 w:1)
	fn moderate_thread_lead(i: u32, k: u32, ) -> Weight {
		(56_767_000 as Weight)
			// Standard Error: 284_000
			.saturating_add((3_614_000 as Weight).saturating_mul(i as Weight))
			// Standard Error: 0
			.saturating_add((1_000 as Weight).saturating_mul(k as Weight))
			.saturating_add(T::DbWeight::get().reads(4 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(T::DbWeight::get().writes(3 as Weight))
	}
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2bb88c49b6e6ccae735eb57de6295caf6a] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:1 w:1)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aed53340396297732bff650c88807adafc] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aedfeb47efcb121b0e718a654f15a6806f] (r:1 w:1)
	// Storage: unknown [0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9] (r:1 w:1)
	fn moderate_thread_moderator(i: u32, k: u32, ) -> Weight {
		(51_171_000 as Weight)
			// Standard Error: 319_000
			.saturating_add((4_867_000 as Weight).saturating_mul(i as Weight))
			// Standard Error: 0
			.saturating_add((1_000 as Weight).saturating_mul(k as Weight))
			.saturating_add(T::DbWeight::get().reads(4 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(T::DbWeight::get().writes(3 as Weight))
	}
	// Storage: unknown [0x2ce461329fdf4be12bce01afc0af09bc13020dc69e85870ac7b4c755bb8753c2] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aedfeb47efcb121b0e718a654f15a6806f] (r:1 w:1)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:1 w:0)
	// Storage: unknown [0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9] (r:2 w:2)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4ae503ee3d19713303eb815933d040b41ee] (r:1 w:1)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aec50c142a64f2c4bb5f5a5506f78ade7e] (r:0 w:1)
	fn add_post(i: u32, j: u32, ) -> Weight {
		(68_678_000 as Weight)
			// Standard Error: 346_000
			.saturating_add((4_562_000 as Weight).saturating_mul(i as Weight))
			// Standard Error: 0
			.saturating_add((1_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(T::DbWeight::get().reads(5 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(T::DbWeight::get().writes(5 as Weight))
	}
	// Storage: unknown [0x2ce461329fdf4be12bce01afc0af09bc13020dc69e85870ac7b4c755bb8753c2] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aedfeb47efcb121b0e718a654f15a6806f] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:1 w:0)
	fn react_post(i: u32, ) -> Weight {
		(21_468_000 as Weight)
			// Standard Error: 391_000
			.saturating_add((4_523_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(T::DbWeight::get().reads(2 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
	}
	// Storage: unknown [0x2ce461329fdf4be12bce01afc0af09bc13020dc69e85870ac7b4c755bb8753c2] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aedfeb47efcb121b0e718a654f15a6806f] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aec50c142a64f2c4bb5f5a5506f78ade7e] (r:1 w:1)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:1 w:0)
	fn edit_post_text(i: u32, j: u32, ) -> Weight {
		(31_089_000 as Weight)
			// Standard Error: 187_000
			.saturating_add((4_779_000 as Weight).saturating_mul(i as Weight))
			// Standard Error: 0
			.saturating_add((2_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(T::DbWeight::get().reads(3 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(T::DbWeight::get().writes(1 as Weight))
	}
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2b3091994c5737d8f16ba1c53919a94bf2] (r:1 w:0)
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2bb88c49b6e6ccae735eb57de6295caf6a] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aedfeb47efcb121b0e718a654f15a6806f] (r:1 w:1)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aec50c142a64f2c4bb5f5a5506f78ade7e] (r:1 w:1)
	// Storage: unknown [0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9] (r:1 w:1)
	fn moderate_post_lead(i: u32, j: u32, ) -> Weight {
		(56_151_000 as Weight)
			// Standard Error: 482_000
			.saturating_add((7_054_000 as Weight).saturating_mul(i as Weight))
			// Standard Error: 0
			.saturating_add((1_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(T::DbWeight::get().reads(5 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(T::DbWeight::get().writes(3 as Weight))
	}
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2bb88c49b6e6ccae735eb57de6295caf6a] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aed53340396297732bff650c88807adafc] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aedfeb47efcb121b0e718a654f15a6806f] (r:1 w:1)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aec50c142a64f2c4bb5f5a5506f78ade7e] (r:1 w:1)
	// Storage: unknown [0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9] (r:1 w:1)
	fn moderate_post_moderator(i: u32, _j: u32, ) -> Weight {
		(62_812_000 as Weight)
			// Standard Error: 249_000
			.saturating_add((6_486_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(T::DbWeight::get().reads(5 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(T::DbWeight::get().writes(3 as Weight))
	}
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aedfeb47efcb121b0e718a654f15a6806f] (r:1 w:1)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aec50c142a64f2c4bb5f5a5506f78ade7e] (r:500 w:500)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:1 w:0)
	// Storage: unknown [0x2ce461329fdf4be12bce01afc0af09bc13020dc69e85870ac7b4c755bb8753c2] (r:1 w:0)
	// Storage: unknown [0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9] (r:2 w:2)
	fn delete_posts(i: u32, j: u32, k: u32, ) -> Weight {
		(0 as Weight)
			// Standard Error: 7_466_000
			.saturating_add((1_095_566_000 as Weight).saturating_mul(i as Weight))
			// Standard Error: 1_000
			.saturating_add((1_000 as Weight).saturating_mul(j as Weight))
			// Standard Error: 47_000
			.saturating_add((46_080_000 as Weight).saturating_mul(k as Weight))
			.saturating_add(T::DbWeight::get().reads(4 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(k as Weight)))
			.saturating_add(T::DbWeight::get().writes(3 as Weight))
			.saturating_add(T::DbWeight::get().writes((1 as Weight).saturating_mul(k as Weight)))
	}
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2b3091994c5737d8f16ba1c53919a94bf2] (r:1 w:0)
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2bb88c49b6e6ccae735eb57de6295caf6a] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:1 w:1)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aedfeb47efcb121b0e718a654f15a6806f] (r:500 w:0)
	fn set_stickied_threads_lead(i: u32, j: u32, ) -> Weight {
		(26_109_000 as Weight)
			// Standard Error: 686_000
			.saturating_add((1_509_000 as Weight).saturating_mul(i as Weight))
			// Standard Error: 5_000
			.saturating_add((6_520_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(T::DbWeight::get().reads(2 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(j as Weight)))
			.saturating_add(T::DbWeight::get().writes(1 as Weight))
	}
	// Storage: unknown [0xcf9da36cc34d922a84a3ec231495ea2bb88c49b6e6ccae735eb57de6295caf6a] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aeed3df8e914a685c674c34bfdc6475340] (r:1 w:1)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aed53340396297732bff650c88807adafc] (r:1 w:0)
	// Storage: unknown [0xaa4612cd135c6055b7910d493c5fd4aedfeb47efcb121b0e718a654f15a6806f] (r:500 w:0)
	fn set_stickied_threads_moderator(i: u32, j: u32, ) -> Weight {
		(37_081_000 as Weight)
			// Standard Error: 750_000
			.saturating_add((320_000 as Weight).saturating_mul(i as Weight))
			// Standard Error: 5_000
			.saturating_add((6_758_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(T::DbWeight::get().reads(2 as Weight))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(T::DbWeight::get().reads((1 as Weight).saturating_mul(j as Weight)))
			.saturating_add(T::DbWeight::get().writes(1 as Weight))
	}
}

// Default implementation for tests
impl WeightInfo for () {
	fn create_category(i: u32, j: u32, k: u32, ) -> Weight {
		0
	}
	fn update_category_membership_of_moderator_new() -> Weight {
		0
	}
	fn update_category_membership_of_moderator_old() -> Weight {
		0
	}
	fn update_category_archival_status_lead(i: u32, ) -> Weight {
		0
	}
	fn update_category_archival_status_moderator(i: u32, ) -> Weight {
		0
	}
	fn update_category_title_lead(i: u32, j: u32, ) -> Weight {
		0
	}
	fn update_category_title_moderator(i: u32, j: u32, ) -> Weight {
		0
	}
	fn update_category_description_lead(i: u32, j: u32, ) -> Weight {
		0
	}
	fn update_category_description_moderator(i: u32, j: u32, ) -> Weight {
		0
	}
	fn delete_category_lead(i: u32, ) -> Weight {
		0
	}
	fn delete_category_moderator(i: u32, ) -> Weight {
		0
	}
	fn create_thread(i: u32, j: u32, k: u32, ) -> Weight {
		0
	}
	fn edit_thread_metadata(i: u32, j: u32, ) -> Weight {
		0
	}
	fn delete_thread(i: u32, ) -> Weight {
		0
	}
	fn move_thread_to_category_lead(i: u32, ) -> Weight {
		0
	}
	fn move_thread_to_category_moderator(i: u32, ) -> Weight {
		0
	}
	fn moderate_thread_lead(i: u32, k: u32, ) -> Weight {
		0
	}
	fn moderate_thread_moderator(i: u32, k: u32, ) -> Weight {
		0
	}
	fn add_post(i: u32, j: u32, ) -> Weight {
		0
	}
	fn react_post(i: u32, ) -> Weight {
		0
	}
	fn edit_post_text(i: u32, j: u32, ) -> Weight {
		0
	}
	fn moderate_post_lead(i: u32, j: u32, ) -> Weight {
		0
	}
	fn moderate_post_moderator(i: u32, _j: u32, ) -> Weight {
		0
	}
	fn delete_posts(i: u32, j: u32, k: u32, ) -> Weight {
		0
	}
	fn set_stickied_threads_lead(i: u32, j: u32, ) -> Weight {
		0
	}
	fn set_stickied_threads_moderator(i: u32, j: u32, ) -> Weight {
		0
	}
}
