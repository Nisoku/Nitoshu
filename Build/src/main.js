function testFunction() {
    console.log('Button clicked!');
    console.warn('This is a warning');
    console.error('This is an error');
    console.info('This is an info');
    console.log('Object:', { name: 'Alice', age: 25, hobbies: ['coding', 'reading'] });
}

function outputToPage() {
    const container = document.body;
    const square = document.createElement('div');
    square.classList.add('square');
    container.appendChild(square);
}