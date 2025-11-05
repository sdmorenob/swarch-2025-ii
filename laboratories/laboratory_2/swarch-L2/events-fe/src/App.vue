<template>
  <div class="app">
    <h1>Recommended Events</h1>

    <div class="controls">
      <label>
        User ID:
        <input v-model="userId" type="number" />
      </label>
      <label>
        Limit:
        <input v-model="limit" type="number" />
      </label>
      <button @click="fetchEvents">Get Recommendations</button>
    </div>

    <div v-if="loading">Loading events...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-for="event in events" :key="event.id" class="event-card">
      <h2>{{ event.title }}</h2>
      <p><strong>Description:</strong> {{ event.description }}</p>
      <p><strong>Location:</strong> {{ event.location }}</p>
      <p><strong>Date:</strong> {{ formatDate(event.eventDate) }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const userId = ref(1)
const limit = ref(2)
const events = ref([])
const loading = ref(false)
const error = ref(null)

function formatDate(dateStr) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateStr).toLocaleDateString(undefined, options)
}

async function fetchEvents() {
  loading.value = true
  error.value = null
  events.value = []

  try {
    const response = await fetch(
        `http://localhost:8080/api/v1/events/recommendations?userId=${userId.value}&limit=${limit.value}`
    )
    if (!response.ok) throw new Error('Failed to fetch events')
    events.value = await response.json()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.app {
  font-family: Arial, sans-serif;
  padding: 2rem;
}
.controls {
  margin-bottom: 1rem;
}
.controls label {
  margin-right: 1rem;
}
.event-card {
  border: 1px solid #ccc;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
}
.error {
  color: red;
  margin-bottom: 1rem;
}
</style>
