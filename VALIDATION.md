# 🔍 Code Validation Guide

Este projeto usa validação automatizada para garantir qualidade de código em todos os Pull Requests.

## 🤖 Validação Automática (GitHub Actions)

Dois workflows rodam em todo Pull Request:

### `ci.yml` — gate de qualidade (bloqueante)

Roda em **todos** os PRs (sem filtro de path, então também cobre bumps de dependência):

1. **CSS build sync** — `npm run build:css:check` falha se `styles.css` estiver fora de sincronia com os módulos em `css/`
2. **Lint (hard-fail)** — `npm run validate` roda html-validate, stylelint e ESLint; erros quebram o build
3. **E2E** — instala os browsers do Playwright e roda toda a suíte (desktop + mobile)

Esse job é o gate real. Além disso, ele **aprova e faz squash-merge automático** de PRs do Dependabot patch/minor quando o gate passa (bumps major ficam para revisão manual).

### `validate-pr.yml` — relatório informativo

Roda em mudanças de HTML/CSS/JS e posta um comentário-resumo no PR:

1. **HTML Validation** — estrutura, meta tags, links externos, estilos inline
2. **CSS Linting** — sintaxe, qualidade (stylelint), uso de `!important`, vendor prefixes
3. **JavaScript Linting** — sintaxe, qualidade (ESLint), console.log/debugger
4. **File Size Checks** — HTML < 500KB · CSS < 100KB · JS < 50KB
5. **Security Checks** — inline event handlers, recursos externos
6. **Required Files** — `index.html`, `styles.css`, `script.js`

## 💻 Validação Local

### Instalação

```bash
npm install
```

### Comandos Disponíveis

```bash
# Build do CSS (concatena css/ → styles.css)
npm run build:css
npm run build:css:check   # falha se styles.css estiver desatualizado

# Validação completa (build sync + lint HTML/CSS/JS)
npm run validate

# Validação + E2E (o check completo, igual ao CI)
npm test

# Lint individual
npm run lint:html
npm run lint:css          # lint dos módulos em css/
npm run lint:js

# Auto-fix (CSS e JS)
npm run lint:fix

# Testes E2E do Playwright (desktop + mobile)
npm run test:e2e
npm run test:e2e:headed
```

> **Pre-commit:** um hook do husky + lint-staged roda no `git commit` — faz lint dos arquivos em stage e, se um módulo `css/` mudou, reconstrói o `styles.css` e o adiciona novamente ao stage.

## 📋 Arquivos de Configuração

- **`eslint.config.js`** - Configuração do ESLint (flat config, v9+) para JavaScript
- **`.stylelintrc.json`** + **`.stylelintignore`** - Stylelint (lint dos módulos em `css/`; ignora o `styles.css` gerado)
- **`.htmlvalidate.json`** - HTML Validate
- **`.editorconfig`** - Regras de indentação por tipo de arquivo
- **`playwright.config.js`** - Testes E2E (projetos desktop + mobile)
- **`scripts/build-css.js`** - Concatena os módulos `css/` em `styles.css`
- **`.github/dependabot.yml`** - PRs semanais de atualização de dependências
- **`.github/workflows/ci.yml`** - Gate de teste + auto-merge do Dependabot
- **`.github/workflows/validate-pr.yml`** - Relatório de lint no PR

## 🔧 Como Funciona

### 1. Pull Request Criado

Quando você cria um PR alterando arquivos `.html`, `.css` ou `.js`:

```bash
git checkout -b minha-feature
# ... faça suas alterações ...
git add .
git commit -m "feat: nova feature"
git push origin minha-feature
# Abra PR no GitHub
```

### 2. Actions Executadas

- **`ci.yml`** roda o gate: build sync + lint + E2E. Em PRs do Dependabot com bump patch/minor, o PR é aprovado e mergeado automaticamente após o gate passar.
- **`validate-pr.yml`** gera o relatório de lint e comenta no PR.
- **`claude-code-review.yml`** posta o review da IA.

### 3. Review do Resultado

Veja os resultados em:
- **PR Comments** - Resumo do lint + review da IA
- **Actions Tab** - Logs detalhados (incl. a suíte E2E)
- **Checks** - Status de cada job; o check "Validate, CSS sync & E2E" é o gate bloqueante

## 🎯 Boas Práticas

### HTML
```html
✅ BOM
<div class="card">
  <h2>Título</h2>
</div>

❌ EVITAR
<div style="color: red">Texto</div>
<div onclick="alert('test')">Clique</div>
```

### CSS
```css
✅ BOM
.card {
    padding: 1rem;
    margin: 1rem 0;
}

❌ EVITAR
.card {
    padding: 1rem !important;
    margin: 1rem 0 !important;
}
```

### JavaScript
```javascript
✅ BOM
function showTab(event, tabName) {
    const element = document.getElementById(tabName);
    if (element) {
        element.classList.add('active');
    }
}

❌ EVITAR
function showTab(event,tabName){
console.log('debug');
document.getElementById(tabName).classList.add('active')
}
```

## 🚨 Resolvendo Erros Comuns

### ESLint: "no-console"
```javascript
// ❌ Erro
console.log('debug info');

// ✅ Remover ou comentar
// console.log('debug info');
```

### Stylelint: "indentation"
```css
/* ❌ Erro */
.card {
  padding: 1rem;
    margin: 1rem; /* indentação errada */
}

/* ✅ Correto */
.card {
    padding: 1rem;
    margin: 1rem;
}
```

### HTML Validate: "missing meta tag"
```html
<!-- ❌ Faltando -->
<head>
    <title>Site</title>
</head>

<!-- ✅ Completo -->
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Descrição do site">
    <title>Site</title>
</head>
```

## 🎓 Recursos Adicionais

- [ESLint Rules](https://eslint.org/docs/latest/rules/)
- [Stylelint Rules](https://stylelint.io/user-guide/rules)
- [HTML Validate](https://html-validate.org/)
- [GitHub Actions](https://docs.github.com/en/actions)

## 🤝 Contribuindo

Antes de criar um PR:

1. ✅ Rode `npm run validate` localmente
2. ✅ Corrija todos os erros
3. ✅ Teste no navegador
4. ✅ Crie o PR

## 📞 Suporte

Se encontrar problemas com as validações, abra uma issue ou contate o mantenedor do projeto.

---

**Última atualização:** 2026-06-11
