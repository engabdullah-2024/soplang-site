export interface PlaygroundExample {
  id: string;
  title: string;
  code: string;
}

export const playgroundExamples: PlaygroundExample[] = [
  {
    id: 'hello-world',
    title: 'Hello World',
    code: `// Hello World
qor("Salaan, Adduunka!")
`,
  },
  {
    id: 'variables',
    title: 'Variables & Types',
    code: `door magac = "Aamina"
abn da = 25
jajab qiimo = 3.14
bool sax = run

qor(magac)
qor(da)
qor(qiimo)
qor(sax)
`,
  },
  {
    id: 'conditionals',
    title: 'Conditionals',
    code: `abn da = 17

haddii (da >= 18) {
    qor("Waad qaan gaadhay")
} haddii_kale (da >= 13) {
    qor("Waxaad tahay dhallinyaro")
} ugudambeyn {
    qor("Waad yar tahay")
}
`,
  },
  {
    id: 'loops',
    title: 'Loops',
    code: `abn i = 1
intay (i <= 5) {
    qor("i = " + i)
    i = i + 1
}

kuceli (j 1 ilaa 5) {
    qor("Tirada: " + j)
}
`,
  },
  {
    id: 'functions',
    title: 'Functions',
    code: `hawl labageybi(a, b) {
    celi a + b
}

qor(labageybi(3, 4))
`,
  },
  {
    id: 'objects',
    title: 'Objects & Lists',
    code: `walax qof = {
    magac: "Ayaan",
    da: 25
}

teed numbers = [10, 20, 30]

qor(qof)
kuceli (i 0 ilaa numbers.dherer() - 1) {
    qor("Element " + i + ": " + numbers[i])
}
`,
  },
];
