<template>
  <div>
    <h1>プレゼンターコントロール</h1>
    <p>現在のスライド番号: {{ currentSlideNumber }}</p>
    <button @click="previousSlide" :disabled="currentSlideIndex === 0">前のスライド</button>
    <button @click="nextSlide" :disabled="currentSlideIndex === totalSlides - 1">次のスライド</button>
  </div>
</template>