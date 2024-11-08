# TypeScript + Vue

**PropType**

```ts
const props = defineProps({
  activity: Object as PropType<Activity>
});
```

**emit**

```ts
const emit = defineEmits<{
  change: [id: number]
  update: [value: string]
}>()
```

**ref/reactive**

```ts
const n = ref<number>()
const book: Book = reactive({ title: 'Vue 3 指引' })
```

**computed**

```ts
const selectedBook = computed<Book>(() => {});
```
