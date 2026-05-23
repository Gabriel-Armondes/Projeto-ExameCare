# ExameCare

Aplicação para familiares que precisam organizar exames, resultados e consultas médicas de idosos.

Esta evolução muda o projeto de um protótipo estático para uma arquitetura pronta para produção:

<<<<<<< HEAD
- cadastro, login, recuperação simulada de senha e logout;
- cadastro com perfil de familiar/cuidador ou profissional de saúde;
- validação de senha forte e confirmação exatamente igual;
- consentimento LGPD no cadastro;
- cadastro e seleção de múltiplos idosos;
- datas em formato brasileiro `00/00/0000`, com validação de data real;
- agendamento de exames por familiar ou profissional;
- edição, cancelamento, exclusão, confirmação e resultado de exames restritos a profissionais;
- tipo de exame e especialidade médica por listas padronizadas, conforme Wiki;
- módulo de consultas;
- histórico de exames realizados;
- regras de data futura, campos obrigatórios e imutabilidade de exames realizados;
- simulação visual dos lembretes de e-mail para 5 e 1 dias antes do exame;
- interface responsiva com modo branco/preto.
=======
- front-end em React + Vite;
- API REST em NestJS;
- Prisma ORM com banco relacional PostgreSQL por padrão, com opção de MySQL;
- senhas hasheadas com bcrypt;
- autenticação JWT;
- suporte a HTTPS no servidor;
- estrutura para notificações push reais com VAPID/Web Push;
- módulos de pacientes idosos, exames, upload de resultados, consultas e perfil.

## Estrutura

```text
apps/
  api/      API REST NestJS + Prisma
  web/      Front-end React/Vite
prisma/     Schema relacional do banco
```
>>>>>>> e8fc965 (Atualizações do projeto ExameCare)

## Como executar

Instale as dependências:

```bash
npm install
```

Configure o ambiente:

```bash
cp .env.example .env
```

No Windows PowerShell:

<<<<<<< HEAD
- criar conta com consentimento LGPD;
- fazer login e logout;
- cadastrar, editar e excluir idoso;
- agendar exame com data futura, tipo, especialidade e local;
- bloquear exame sem campos obrigatórios ou com data inválida;
- entrar como profissional e editar, cancelar, apagar, marcar exame como realizado e subir resultado;
- agendar consulta e alterar status como profissional;
- confirmar que exame realizado aparece no histórico e não pode ser editado ou cancelado;
- conferir lembrete visual para exames em 5 ou 1 dias.
=======
```powershell
Copy-Item .env.example .env
```
>>>>>>> e8fc965 (Atualizações do projeto ExameCare)

No Prompt de Comando:

```bat
copy .env.example .env
```

Para que e-mails reais sejam enviados, preencha também as variáveis SMTP no `.env`:

```env
MAIL_HOST="smtp.seuprovedor.com"
MAIL_PORT="587"
MAIL_USER="seu-email@provedor.com"
MAIL_PASS="sua-senha-ou-app-password"
MAIL_FROM="ExameCare <seu-email@provedor.com>"
WEB_ORIGIN="http://localhost:5173"
```

Enquanto o SMTP não estiver configurado, a API imprime o link de verificação/recuperação no terminal para facilitar testes locais.

Suba o PostgreSQL local com Docker:

```bash
docker compose up -d
```

Gere o client do Prisma e rode as migrações:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Inicie front-end e API:

```bash
npm run dev
```

URLs padrão:

- Front-end: `http://localhost:5173`
- API: `http://localhost:3000/api`

## Banco de dados

O `prisma/schema.prisma` usa PostgreSQL por padrão:

```prisma
provider = "postgresql"
```

Para MySQL, altere o provider:

```prisma
provider = "mysql"
```

E ajuste `DATABASE_URL` no `.env`.

Se aparecer o erro `P1001: Can't reach database server at localhost:5432`, o banco ainda não está rodando. Inicie com `docker compose up -d` ou instale/inicie o PostgreSQL localmente usando os mesmos dados do `.env`:

```text
host: localhost
porta: 5432
banco: examecare
usuario: postgres
senha: postgres
```

## Funcionalidades

- cadastro e login de responsável;
- verificação de conta por e-mail antes do primeiro login;
- recuperação de senha por link enviado ao e-mail verificado;
- consentimento LGPD no cadastro;
- personalização de perfil com tema, cor, tamanho da fonte, canal de notificação, telefone, cidade e foto;
- cadastro e seleção de múltiplos idosos;
- agendamento, edição, cancelamento e conclusão de exames;
- upload e acompanhamento de resultado de exames;
- módulo de consultas com médico, especialidade, data, tipo, status e observações;
- painel com indicadores e lembretes;
- rodapé institucional;
- layout responsivo com cores e imagens.

## Produção

Para produção, configure:

- `JWT_SECRET` forte;
- `DATABASE_URL` do banco real;
- certificados `HTTPS_KEY_PATH` e `HTTPS_CERT_PATH`;
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT`;
- armazenamento real para arquivos enviados, como S3, GCS, Azure Blob ou volume seguro;
- política de backup, auditoria e retenção de dados de saúde.
"# ExameCare" 
