async function test() {
  try {
    const resAuth = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ci: '1000000', password: 'password123' })
    });
    
    let token = null;
    
    if (!resAuth.ok) {
        const resAuth2 = await fetch('http://localhost:3000/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ci: '1000000', password: '1000000' })
        });
        const data2 = await resAuth2.json();
        token = data2.access_token;
    } else {
        const data = await resAuth.json();
        token = data.access_token;
    }

    if (!token) {
        console.error('Failed to get token');
        return;
    }

    // Call fases-auth
    const resFases = await fetch('http://localhost:3000/api/v1/evaluaciones/fases-auth', {
       headers: { 'Authorization': `Bearer ${token}` }
    });
    const fasesData = await resFases.text();
    console.log('fases-auth result:', fasesData);

    // Call POST fases
    const resFasesPost = await fetch('http://localhost:3000/api/v1/evaluaciones/fases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nombre: 'Test', pesoPorcentaje: 10, fechaInicio: '2026-05-01', fechaFin: '2026-05-30', estaActiva: true, urlImagen: '', juradosIds: [] })
    });
    const postData = await resFasesPost.text();
    console.log('fases POST result:', postData);

  } catch (error) {
    console.error('FAIL', error);
  }
}
test();
