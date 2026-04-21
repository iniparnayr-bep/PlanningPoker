<template>
  <a-form
      @submit.prevent="handleSubmit"
      layout="vertical"
  >
    <a-form-item
        label="Title"
        :rules="[{ required: true, message: 'Please input the title!' }]"
    >
      <a-input
          v-model:value="formData.title"
          placeholder="Enter the title"
      />
    </a-form-item>

    <a-form-item
        label="Text"
        :rules="[{ required: true, message: 'Please input the text!' }]"
    >
      <a-textarea
          v-model:value="formData.text"
          placeholder="Enter the text"
          rows="4"
      />
    </a-form-item>

    <a-form-item>
      <div class="action-container">
        <a-button
            type="primary"
            html-type="submit"
            :loading="loading"
        >
          Submit
        </a-button>
        <RouterLink to="/">
          <a-button type="default" class="guest-button">Home</a-button>
        </RouterLink>
      </div>
    </a-form-item>
  </a-form>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import axios from 'axios';
import { message } from 'ant-design-vue';
import env from "@/environments/environments";
import environment from "@/environments/environments";

// Define props
const props = defineProps({
  requestType: {
    type: String,
    required: true,
    validator(value: string) {
      return ['bugreport', 'changerequest'].includes(value);
    }
  }
});

// Define data
const formData = ref({
  title: '',
  text: ''
});

const loading = ref(false);

// Methods
const handleSubmit = async () => {
  if (!formData.value.title || !formData.value.text) {
    message.error('Please fill in both the title and the text.');
    return;
  }
  if (environment.devServer) {
    formData.value.title = '[From Testserver] ' + formData.value.title;
  }
  loading.value = true;
  try {
    const response = await axios.post(`${env.apiServiceRoute}/${props.requestType}`, formData.value);

    if (response.status === 200) {
      message.success('Your request was submitted successfully.');
    } else {
      message.error('An error occurred.');
    }
  } catch (error: any) {
    if (error?.response?.status === 429)
      message.warn('Too many requests, please try again later.');
    else
      message.error('An error occurred.');
  } finally {
    loading.value = false;
    formData.value = {
      text: '',
      title: '',
    };
  }
};
</script>

<style scoped>
.action-container {
  display: flex;
  gap: 1rem;
}
</style>
