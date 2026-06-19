// api/oracion-prueba.js
// Genera UNA oración de prueba gratis usando la misma IA real (Groq)
// que usa la app de pago, para que la persona que llega desde el quiz
// vea una oración genuina antes de decidir comprar.
// No requiere login ni contraseña — pensado para el flujo del embudo de marketing.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { nombre, santo, peticion, parentesco, esParaOtro } = req.body;

    if (!santo) return res.status(400).json({ error: 'Falta el santo' });

    const nombreTexto = nombre ? nombre : 'esta persona';
    const intencion = peticion || 'una necesidad profunda del corazón';

    let contextoDestinatario = '';
    if (esParaOtro === '1' || esParaOtro === true) {
      const vinculo = parentesco ? parentesco.toLowerCase() : 'una persona querida';
      contextoDestinatario = `Esta oración es para ${nombreTexto}, quien es ${vinculo} de la persona que la pide. Dirige la oración pensando en ${nombreTexto} como el sujeto que recibe la intercesión, no en quien la solicita.`;
    } else {
      contextoDestinatario = `Esta oración es para ${nombreTexto} mismo/a, quien la pide para sí.`;
    }

    const prompt = `Eres un guía espiritual católico experto en oración devocional. Escribe una oración profunda, estructurada y devocional dirigida a ${santo} para ${nombreTexto}, quien necesita: ${intencion}.

${contextoDestinatario}

La oración debe seguir esta estructura:
1. INVOCACIÓN: Abre con el nombre completo del santo y uno de sus títulos espirituales (2-3 oraciones solemnes).
2. RECONOCIMIENTO: Reconoce la misericordia de Dios y el rol intercesor del santo ante Él (2-3 oraciones).
3. PRESENTACIÓN DE LA INTENCIÓN: Presenta la necesidad específica de forma emotiva y personal (3-4 oraciones).
4. SÚPLICA: Pide la intercesión con fe y humildad, usando imágenes bíblicas o espirituales propias del santo (3-4 oraciones).
5. ACTO DE FE: Expresa confianza en la voluntad de Dios y entrega total (2-3 oraciones).
6. CIERRE: Fórmula devocional breve y solemne. Termina siempre con Amén.

Reglas: español latinoamericano, trato de "tú" al santo, entre 200 y 260 palabras, tono solemne y cálido. Responde solo con el texto de la oración, sin títulos ni encabezados adicionales.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.8
      })
    });

    const data = await response.json();

    if (data.choices && data.choices[0]?.message?.content) {
      return res.status(200).json({ texto: data.choices[0].message.content.trim() });
    }

    return res.status(200).json({ texto: null, error: 'Sin respuesta de la IA', debug: data });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
