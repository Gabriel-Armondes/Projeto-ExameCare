# ExameCare

MVP web responsivo para familiares que precisam organizar exames médicos de idosos.

O projeto foi iniciado a partir dos documentos de visão, requisitos e arquitetura fornecidos. Como os PDFs tinham informações redundantes/incompletas, a primeira versão prioriza o núcleo comum dos documentos:

- cadastro, login, recuperação simulada de senha e logout;
- consentimento LGPD no cadastro;
- cadastro e seleção de múltiplos idosos;
- agendamento, edição, cancelamento e confirmação de exames;
- tipo de exame e especialidade médica por listas padronizadas, conforme Wiki;
- histórico de exames realizados;
- regras de data futura, campos obrigatórios e imutabilidade de exames realizados;
- simulação visual dos lembretes de e-mail para 5 e 1 dias antes do exame;
- interface responsiva com contraste alto opcional.

## Como executar

Abra o arquivo `index.html` diretamente no navegador.

Também é possível iniciar um servidor local:

```bash
python -m http.server 5173
```

Depois acesse `http://localhost:5173`.

## Observação técnica

Esta versão usa `localStorage` para permitir validação rápida do MVP sem backend. Em produção, os documentos indicam evolução para React/Vite no front-end, API REST em NestJS, Prisma e banco relacional PostgreSQL/MySQL, com senhas hasheadas, HTTPS, autenticação JWT e notificações push reais.
