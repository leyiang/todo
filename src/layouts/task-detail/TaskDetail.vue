<script setup lang="ts">
import {computed, ref} from "vue";
import TaskDetailAddStep from "./TaskDetailAddStep.vue";
import Task from "@/core/model/Task";
import StepItem from "./StepItem.vue";
import ResizableTextarea from "@/components/common/ResizableTextarea.vue";
import FinishedPlanToggleButton from "@/layouts/FinishedPlanToggleButton.vue"
import { adapter } from "@/stores/TodoStore";

const props = defineProps({
    task: {
        type: Task,
        required: true
    }
});

const allSteps = computed(() => {
    const steps = props.task.steps.slice();

    return steps.sort( (step, step1) => {
        if( step1.priority === step.priority ) {
            return step1.id - step.id;
        }

        return step1.priority - step.priority;
    });
});

const steps = computed(() => {
    return allSteps.value.filter( step => ! step.finished );
});

const finishedSteps = computed(() => {
    return allSteps.value.filter( step => step.finished );
});

const show = ref(false);

function updateTaskDescription(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    const value = target.value.toString().trim();

    adapter.setTaskProp( props.task.id, "description", value).then(() => {
        props.task.description = value;
    });
}

function renameTask(e: Event) {
    const target = e.target as HTMLInputElement;
    const value = target.value.trim();

    if( value.length !== 0 ) {
        adapter.setTaskProp( props.task.id, "name", value ).then(() => {
            props.task.name = value;
        });
    }
}

</script>

<template>
    <aside
        class="task-detail flex flex-col bg-gray-50"
        p-1rem
    >
        <div class="flex flex-col flex-1" overflow-hidden>
            <input
                data-test="task-name-input"
                :value="task.name"
                mb-1rem text-xl px-10px
                border="none"
                bg-transparent

                @change="renameTask"
            />

            <div class="flex flex-col flex-1 custom-scrollbar" overflow-auto>
                <StepItem
                    v-for="step in steps"
                    :key="step.id"
                    :step="step"
                />

                <div class="flex" v-if="finishedSteps.length">
                    <FinishedPlanToggleButton
                        data-test="finished-step-toggle-btn"
                        flex-1
                        bg-gray-400
                        @click="show = ! show"
                        :show="show"
                    />
                </div>

                <template v-if="show">
                    <StepItem
                        v-for="step in finishedSteps"
                        :key="step.id"
                        :step="step"
                    />
                </template>
            </div>

            <TaskDetailAddStep />
        </div>
        
        <div class="divider" my-2rem h-1px bg-gray-200></div>

        <div
            data-test="task-detail-additional"
            flex="~ 1 col"
        >
            <ResizableTextarea
                data-test="task-description"
                class="rounded box-shadow-none p-1rem"
                border="1 gray-300"
                placeholder="Task Description"
                v-text="props.task.description"
                @change="updateTaskDescription"
            />
        </div>
    </aside>
</template>