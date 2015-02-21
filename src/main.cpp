#define GLFW_INCLUDE_NONE
#include <stdlib.h>
#include <stdio.h>
#include <GLES2/gl2.h>

#include <GL/glfw.h>
#include <emscripten/emscripten.h>
#include <ctime>
 
int init_gl();
void do_frame();
void shutdown_gl();

typedef struct {
  GLuint programObject;

} userData;
 
unsigned int frames = 0;


const char *read_file(const char * path) {
    FILE *f = fopen(path, "r");
    fseek(f, 0, SEEK_END);
    long fsize = ftell(f);
    fseek(f, 0, SEEK_SET);
    char *ret = (char*)calloc(fsize, sizeof(char));
    fread(ret, fsize+1, 1, f);
    fclose(f);
    ret[fsize] = 0;
    return ret;
}

int main()
{
    if (init_gl() == GL_TRUE) {

        emscripten_set_main_loop(do_frame, 0, 1);
    }
  
    return 0;
}

GLuint LoadShader (const char *shader_path, GLenum type) {
    GLuint shader;
    GLint compiled;

    const char *shader_code = read_file(shader_path);

    shader = glCreateShader(type);

    if (shader == 0)
        return 0;

    glShaderSource(shader, 1, &shader_code, NULL);
    glCompileShaderiv(shader, GL_COMPILE_STATUS, &compiled);
    if(!compiled) {
        GLint infoLen = 0;
        glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &infoLen);
 
        if(infoLen > 1) {
            char* infoLog = malloc(sizeof(char) * infoLen);
            glGetShaderInfoLog(shader, infoLen, NULL, infoLog);
            esLogMessage("Error compiling shader:\n%s\n", infoLog);
            free(infoLog);
        }
        glDeleteShader(shader);
        return 0;
    }
    return shader;
}

int init_shaders() {
    GLuint programObject;
    GLuint vertexShader;
    GLuint fragmentShader;
    GLint linked;

    vertexShader = LoadShader(GL_VERTEX_SHADER, "elem.vs");
    fragmentShader = LoadShader(GL_FRAGMENT_SHADER, "elem.fs");

    glBindAttribLocation(programObject, 0, "vPosition");
    glLinkProgram(programObject);
    glGetProgramiv(programObject, GL_LINK_STATUS, &linked);

    if(!linked) 
    {
        GLint infoLen = 0;
        glGetProgramiv(programObject, GL_INFO_LOG_LENGTH, &infoLen);

        if(infoLen > 1)
        {
            char* infoLog = malloc(sizeof(char) * infoLen);
            glGetProgramInfoLog(programObject, infoLen, NULL, infoLog);
            esLogMessage("Error linking program:\n%s\n", infoLog);

            free(infoLog);
        }
        glDeleteProgram(programObject);
        return FALSE;
    }
    glClearColor(1, 0, 0, 0);

    userData->programObject = programObject;
}

int init_gl()
{
    const int width = 480,
             height = 800;
 
    if (glfwInit() != GL_TRUE) {
        printf("glfwInit() failed\n");
        return GL_FALSE;
    }
 
    if (glfwOpenWindow(width, height, 8, 8, 8, 8, 16, 0, GLFW_WINDOW) != GL_TRUE) {
        printf("glfwOpenWindow() failed\n");
        return GL_FALSE;
    }
 
    return GL_TRUE;
}
 
void do_frame()
{
	double tTime = glfwGetTime();
	GLfloat vVertices[] = {0.0f, 0.5f, 0.0f,
                           -0.5f, -0.5f, 0.0f,
                           0.5f, -0.5f, 0.0f}
	if (tTime > 10) {
		double fps;
		fps = frames/tTime;
		glfwSetTime(0);
		frames = 0;
		fprintf(stdout, "FPS: %lf\n", fps );
		fflush(stdout);
	}
	glClear(GL_COLOR_BUFFER_BIT);
    glfwSwapBuffers();
  	++frames;
}
 
void shutdown_gl()
{
    glfwTerminate();
}