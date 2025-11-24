# ❓ Zapi10 - FAQ para Apresentação

## Perguntas Frequentes e Respostas Preparadas

---

## 💰 SOBRE PREÇOS E CÁLCULOS

### P1: "Como vocês calculam o preço exatamente?"
**R:** 
> "Usamos uma fórmula simples e transparente: Distância × Valor por Km, com um valor mínimo garantido. Por exemplo: 4,5 km × R$ 3,50 = R$ 15,75. Se a entrega passar por uma zona especial, como um morro ou ilha, adicionamos um valor fixo ou multiplicador. O cliente vê o cálculo completo antes de confirmar."

### P2: "E se a entrega for muito curta? Tipo, 500 metros?"
**R:**
> "Ótima pergunta! Por isso temos o valor mínimo. Mesmo que o cálculo dê R$ 2,00, nunca cobramos menos que o mínimo (geralmente R$ 10,00). Isso protege contra entregas não lucrativas e compensa custos fixos como gasolina, tempo e desgaste."

### P3: "Como vocês sabem a distância real?"
**R:**
> "Usamos a integração com Google Maps, a mesma tecnologia que você usa no celular. O sistema calcula a distância REAL de carro, não em linha reta. É preciso e confiável."

### P4: "O cliente pode contestar o preço?"
**R:**
> "Sim e não. O preço é calculado automaticamente com base no contrato dele. Ele vê o valor ANTES de confirmar. Se achar caro, pode não fazer a entrega. Mas o cálculo é sempre transparente e baseado em regras pré-definidas no contrato."

### P5: "Posso ter preços diferentes para clientes diferentes?"
**R:**
> "Absolutamente! Cada contrato pode ter valores personalizados. Cliente VIP pode pagar R$ 3,00/km com desconto, enquanto cliente novo paga R$ 4,00/km. É totalmente flexível."

---

## 🗺️ SOBRE ZONAS ESPECIAIS

### P6: "O que são zonas especiais?"
**R:**
> "São áreas no mapa onde o preço é diferente. Imagine uma ilha que precisa balsa - você pode adicionar R$ 10 fixos. Ou um morro perigoso - você pode multiplicar o preço por 1.5×. O sistema detecta automaticamente se origem ou destino está nessas áreas."

### P7: "Como cadastro uma zona especial?"
**R:**
> "É visual! Você abre o mapa no sistema, usa o mouse para desenhar a área (polígono, círculo ou retângulo), define se é valor fixo ou multiplicador, e salva. A zona fica colorida no mapa e passa a afetar os cálculos imediatamente."

### P8: "Posso ter quantas zonas?"
**R:**
> "Ilimitadas! Você pode cobrir a cidade inteira com zonas diferentes se quiser."

### P9: "E se uma entrega passar por DUAS zonas especiais?"
**R:**
> "O sistema aplica ambas! Se origem está em zona A (1.3×) e destino em zona B (+R$ 5), calcula primeiro o multiplicador e depois adiciona o fixo. Sempre fica claro no detalhamento."

---

## 👥 SOBRE GRUPOS E ORGANIZAÇÃO

### P10: "O que é um 'Grupo'?"
**R:**
> "É como uma empresa de entregas dentro da plataforma. Cada grupo tem um gerente responsável, motoboys contratados, e clientes próprios. Um administrador pode gerenciar vários grupos independentes simultaneamente."

### P11: "Por que eu preciso de grupos?"
**R:**
> "Permite escalabilidade! Imagine que você tem entregas em 3 cidades diferentes. Cria 3 grupos, cada um com seu gerente local. Eles gerenciam seus motoboys e clientes de forma autônoma, sem precisar te incomodar."

### P12: "O gerente pode fazer tudo?"
**R:**
> "Quase tudo! Ele pode adicionar/remover motoboys, gerenciar contratos, ver entregas e balanço financeiro. Mas NÃO pode criar novos grupos ou deletar o grupo - isso é apenas para administradores."

### P13: "Quanto custa ter múltiplos grupos?"
**R:**
> "O sistema suporta múltiplos grupos nativamente. É parte das funcionalidades da plataforma."

---

## 🏍️ SOBRE MOTOBOYS

### P14: "Como o motoboy é selecionado?"
**R:**
> "Seleção manual pelo sistema: mostra motoboys disponíveis, ordenados por distância até o ponto de coleta. Você escolhe. Já estamos desenvolvendo inteligência artificial que escolhe automaticamente o melhor match considerando histórico, avaliação e balanceamento."

### P15: "E se todos os motoboys estiverem ocupados?"
**R:**
> "O sistema mostra isso! Se não aparecer ninguém na lista, você sabe que precisa esperar ou contratar mais motoboys. Transparência total."

### P16: "Como funciona a comissão do motoboy?"
**R:**
> "Definida no contrato. Exemplo: entrega de R$ 25, comissão 95% = motoboy recebe R$ 23,75, grupo fica com R$ 1,25. Sistema calcula automaticamente no final do dia/mês."

### P17: "Motoboy pode recusar entrega?"
**R:**
> "Pode! Quando recebe notificação, ele aceita ou recusa. Se recusar muito, isso afeta a avaliação dele. Sistema tem histórico completo."

---

## 💼 SOBRE CONTRATOS

### P18: "Preciso fazer contrato com cada cliente?"
**R:**
> "Não é obrigatório. Sem contrato, usa valores padrão do sistema. MAS, contrato te dá flexibilidade: preços personalizados, descontos, período específico."

### P19: "Posso ter vários contratos com o mesmo cliente?"
**R:**
> "Sim! Um para entregas normais (R$ 3,50/km) e outro para entregas expressas (R$ 5,00/km). Sistema escolhe o adequado."

### P20: "O que acontece quando o contrato vence?"
**R:**
> "Sistema avisa antes. Você pode renovar com novos valores ou deixar vencer. Se vencer, entregas usam valores padrão ou você não pode criar novas entregas para aquele cliente."

---

## 💻 SOBRE TECNOLOGIA

### P21: "Funciona em celular?"
**R:**
> "Sim! É 100% responsivo. Funciona em qualquer dispositivo. Estamos desenvolvendo aplicativo nativo para motoboys com recursos específicos como GPS em tempo real."

### P22: "E se a internet cair?"
**R:**
> "Sistema é web, precisa de internet. MAS, todos os dados ficam salvos. Quando voltar, continua de onde parou. Modo offline está em desenvolvimento."

### P23: "Como é a segurança?"
**R:**
> "Autenticação JWT, HTTPS obrigatório, dados criptografados, backup automático. Além disso, sistema de permissões garante que cada usuário vê apenas o que deve ver."

### P24: "Integra com outros sistemas?"
**R:**
> "Temos REST API completa. Você pode integrar com sistema de gestão, pagamento, WhatsApp, qualquer coisa. Documentação disponível."

---

## 💰 SOBRE FINANCEIRO

### P25: "Como o cliente paga?"
**R:**
> "Diariamente. Final do dia, sistema mostra total de entregas. Cliente entra no sistema e registra pagamento. Integração com plataformas de pagamento online está em desenvolvimento."

### P26: "Como o motoboy recebe?"
**R:**
> "Depende do grupo. Pode ser por entrega, semanal ou mensal. Sistema calcula automaticamente com base na comissão definida no contrato."

### P27: "Tem relatório financeiro?"
**R:**
> "Completo! Gerente do grupo vê: total de entregas, receita bruta, comissões pagas, lucro líquido. Filtros por período, motoboy, cliente."

### P27b: "Quanto posso ganhar como gerente de grupo?"
**R:**
> "Depende do volume de operação. Com 50 motoboys trabalhando:
> - **Cenário conservador**: 12 entregas/dia → R$ 5.070/mês
> - **Cenário normal**: 20 entregas/dia → R$ 9.750/mês  
> - **Cenário otimista**: 28 entregas/dia → R$ 15.470/mês
> 
> Você recebe 5% de cada entrega. Quanto mais entregas, maior seu ganho!"

---

## 📊 SOBRE FUNCIONALIDADES

### P28: "Tem notificação para o motoboy?"
**R:**
> "Via sistema web. Notificações instantâneas e SMS estão em desenvolvimento para versão mobile."

### P29: "Cliente pode acompanhar a entrega?"
**R:**
> "Sim! Vê status em tempo real: Pendente → Confirmada → Coletada → Em Trânsito → Entregue. GPS em tempo real virá na versão mobile."

### P30: "Tem sistema de avaliação?"
**R:**
> "Em desenvolvimento! Cliente avalia motoboy, motoboy avalia cliente. Criará ranking e incentivos."

---

## 🚀 SOBRE O SISTEMA

### P31: "O sistema já está pronto?"
**R:**
> "Sim! O sistema web está funcional e sendo usado. Funcionalidades principais como cálculo de preços, gestão de grupos, contratos e zonas especiais estão completas. Aplicativo mobile e inteligência artificial estão em desenvolvimento."

### P32: "Preciso treinar minha equipe?"
**R:**
> "Oferecemos suporte completo: documentação, vídeos explicativos, e sessões de treinamento. Sistema é intuitivo, mas queremos garantir que todos saibam usar todos os recursos."

### P33: "Posso conhecer melhor antes de decidir?"
**R:**
> "Claro! Podemos agendar uma demonstração personalizada mostrando exatamente como o sistema atende suas necessidades específicas."

---

## 💵 SOBRE COMERCIAL

### P34: "Como funciona comercialmente?"
**R:**
> "Estamos em fase de apresentação do sistema. Entre em contato para discutirmos as melhores condições para seu negócio."

### P35: "Tem contrato de fidelidade?"
**R:**
> "Vamos conversar sobre a melhor estrutura para seu caso específico."

### P36: "Posso personalizar funcionalidades?"
**R:**
> "Sim! Sistema é flexível e podemos discutir adaptações específicas para seu negócio."

---

## 🎯 SOBRE DIFERENCIAIS

### P37: "O que vocês têm que a concorrência não tem?"
**R:**
> "1. Múltiplos grupos independentes
> 2. Zonas especiais configuráveis visualmente
> 3. Contratos flexíveis por cliente
> 4. Cálculo transparente e automático
> 5. Sistema de comissão integrado
> 6. Interface moderna e intuitiva
> 
> Enquanto concorrentes têm 1-2 desses recursos, nós temos TODOS."

### P38: "Por que escolher o Zapi10?"
**R:**
> "Nosso diferencial é a flexibilidade e completude: múltiplos grupos, zonas especiais configuráveis, contratos personalizados, cálculo automático transparente. Tudo integrado em uma interface moderna e intuitiva."

---

## 🔮 SOBRE DESENVOLVIMENTO

### P39: "Quais melhorias estão vindo?"
**R:**
> "Em desenvolvimento:
> 1. Aplicativo mobile para motoboys
> 2. Seleção automática com inteligência artificial
> 3. Integração com plataformas de pagamento online
> 4. Sistema de avaliações
> 5. Análises avançadas e indicadores"

### P40: "Aceitam sugestões?"
**R:**
> "Sempre! Estamos abertos a feedback e sugestões de melhorias que agreguem valor ao sistema."

---

## 🤝 SOBRE SUPORTE

### P41: "Tem suporte técnico?"
**R:**
> "Completo! Chat em tempo real, e-mail, telefone. Documentação detalhada e vídeos tutoriais. Tempo de resposta: < 2 horas em horário comercial."

### P42: "E se encontrar um bug?"
**R:**
> "Reporte pelo chat ou e-mail. Time técnico investiga imediatamente. Bugs críticos: corrigidos em < 24h. Bugs menores: na próxima release (semanal)."

---

## 🎓 RESPOSTAS PARA OBJEÇÕES COMUNS

### Objeção 1: "Parece complicado demais"
**R:**
> "Entendo a preocupação! Por isso podemos fazer uma demonstração ao vivo. Na prática, criar uma entrega leva menos de 1 minuto - posso mostrar agora mesmo."

### Objeção 2: "Meu sistema atual funciona"
**R:**
> "Ótimo! Mas quanto tempo você gasta calculando preços manualmente? Quanto tempo organizando motoboys? Quantas disputas tem por preço calculado errado? Nosso objetivo não é substituir algo que funciona, mas OTIMIZAR seu tempo e AUMENTAR a precisão."

### Objeção 3: "Preciso pensar"
**R:**
> "Claro! Que tal agendarmos uma demonstração mais detalhada? Posso mostrar exatamente como o sistema resolve seus desafios específicos."

### Objeção 4: "Minha equipe não vai se adaptar"
**R:**
> "Entendo. Por isso oferecemos treinamento completo incluído. A interface é intuitiva - criar entrega leva menos de 1 minuto. Além disso, suporte está sempre disponível para tirar dúvidas."

### Objeção 5: "E se precisar de algo específico?"
**R:**
> "Sistema é flexível e podemos conversar sobre personalizações. Já atendemos diversos tipos de negócio e estamos abertos a adaptar funcionalidades."

---

## 🎬 FRASES FINAIS PODEROSAS

Após responder perguntas:

> "Mais alguma dúvida? ...Não? Ótimo! Que tal agendarmos uma demonstração personalizada?"

Ou:

> "Ficou claro como o Zapi10 pode ajudar seu negócio? Posso preparar uma apresentação específica para seu caso?"

Ou:

> "Entendi suas necessidades. Vamos marcar uma conversa onde mostro exatamente como o sistema resolve seus desafios?"

---

**🎯 LEMBRE-SE:**

1. **Sempre termine com ação**: "Que tal agendar?", "Posso mostrar mais?", "Vamos conversar?"
2. **Confiança**: Você conhece o produto, sabe que funciona
3. **Empatia**: Entenda as preocupações antes de responder
4. **Transparência**: Seja honesto sobre o que está pronto e o que está em desenvolvimento
5. **Entusiasmo**: Se você acredita, eles acreditam

**BOA SORTE! 🚀**
