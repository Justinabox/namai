<script setup>
import {
  Shader,
  Blur,
  Liquify,
  Spherize,
  Swirl
} from 'shaders/vue'
</script>

<template>
    <Shader>
        <Swirl
            :blend="50"
            color-a="#f542b9"
            color-b="#3680e1"
            color-space="oklab"
            :detail="2"
            :speed="0.5"/>
        <Liquify
            :decay="3"
            edges="stretch"
            :intensity="10"
            :radius="1"/>
        <Blur
            :intensity="50"/>
        <Spherize
            :center="{'x':0.5,'y':0.5}"
            :depth="1"
            light-color="#ffffff"
            :light-intensity="0.5"
            :light-position="{'x':0.3,'y':0.3}"
            :light-softness="0.5"
            :radius="1"/>
    </Shader>
</template>