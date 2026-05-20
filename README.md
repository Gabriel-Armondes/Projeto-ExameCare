# ExameCare

MVP web responsivo para familiares que precisam organizar exames médicos de idosos.

O projeto foi iniciado a partir dos documentos de visão, requisitos e arquitetura fornecidos. Como os PDFs tinham informações redundantes/incompletas, a primeira versão prioriza o núcleo comum dos documentos:

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

## Como executar

Abra o arquivo `index.html` diretamente no navegador.

Também é possível iniciar um servidor local:

```bash
python -m http.server 5173
```

Depois acesse `http://localhost:5173`.

## Validação manual

Antes da entrega, valide os fluxos principais:

- criar conta com consentimento LGPD;
- fazer login e logout;
- cadastrar, editar e excluir idoso;
- agendar exame com data futura, tipo, especialidade e local;
- bloquear exame sem campos obrigatórios ou com data inválida;
- entrar como profissional e editar, cancelar, apagar, marcar exame como realizado e subir resultado;
- agendar consulta e alterar status como profissional;
- confirmar que exame realizado aparece no histórico e não pode ser editado ou cancelado;
- conferir lembrete visual para exames em 5 ou 1 dias.

## Observação técnica

Esta versão usa `localStorage` para permitir validação rápida do MVP sem backend. Em produção, os documentos indicam evolução para React/Vite no front-end, API REST em NestJS, Prisma e banco relacional PostgreSQL/MySQL, com senhas hasheadas, HTTPS, autenticação JWT e notificações push reais.
